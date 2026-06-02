    # app.py
import os
import random
import string
import time

from flask import Flask, request, jsonify, abort, send_from_directory
from flask_socketio import SocketIO, join_room, leave_room

# ---------------------------------------------------------------------
# Config Flask + Socket.IO
# ---------------------------------------------------------------------
app = Flask(__name__, static_folder='static', static_url_path='/static')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'secret!')  # Use env variable in production
_cors_origins = os.environ.get('SOCKETIO_CORS_ORIGINS', '*')
if _cors_origins != '*':
    _cors_origins = [origin.strip() for origin in _cors_origins.split(',') if origin.strip()]
socketio = SocketIO(app, cors_allowed_origins=_cors_origins, async_mode='eventlet')

@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()'
    return response

# ---------------------------------------------------------------------
# Mémoire & constantes
# ---------------------------------------------------------------------
rooms = {}
MAX_PLAYERS = 10
ANIMALS = [
    {'emoji': '🐢', 'name': 'Tortue'},
    {'emoji': '🦊', 'name': 'Renard'},
    {'emoji': '🐯', 'name': 'Tigre'},
    {'emoji': '🐻', 'name': 'Ours'},
    {'emoji': '🐧', 'name': 'Pingouin'},
    {'emoji': '🦁', 'name': 'Lion'},
    {'emoji': '🐼', 'name': 'Panda'},
    {'emoji': '🦆', 'name': 'Canard'},
    {'emoji': '🐨', 'name': 'Koala'},
    {'emoji': '🐸', 'name': 'Grenouille'},
    {'emoji': '🐶', 'name': 'Chien'},
    {'emoji': '🐱', 'name': 'Chat'}
]
VOTE_CONTINUE_TIMEOUT = 30  # secondes
FORBIDDEN_TEXT_CHARS = set("<>&\"'`")

# ---------------------------------------------------------------------
# Utils
# ---------------------------------------------------------------------
def gen_room_id() -> str:
    return 'ROOM-' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))

def _player_in_room(room: dict, sid: str) -> bool:
    return any(p["id"] == sid for p in room["players"])

def _public_players(room):
    return [
        {"id": p.get("id"), "name": p.get("name"), "avatar": p.get("avatar"), "offline": p.get("offline", False)}
        for p in room.get("players", [])
    ]

def build_turns(player_sids):
    sids = list(player_sids)
    random.shuffle(sids)
    n = len(sids)
    return [{"q": sids[i], "t": sids[(i + 1) % n]} for i in range(n)]

def _has_forbidden_text(value: str) -> bool:
    return any(ch in FORBIDDEN_TEXT_CHARS or ord(ch) < 32 or ord(ch) == 127 for ch in value)

def _validate_player_name(name: str):
    name = str(name or '').strip()
    if not name:
        return None, 'Veuillez entrer un pseudo'
    if len(name) < 2:
        return None, 'Le pseudo doit contenir au moins 2 caractères'
    if len(name) > 20:
        return None, 'Le pseudo doit contenir 20 caractères maximum'
    if _has_forbidden_text(name):
        return None, 'Le pseudo contient des caractères interdits'
    return name, None

def _clean_avatar(avatar):
    avatar = str(avatar or '🙂').strip()
    if not avatar or len(avatar) > 8 or _has_forbidden_text(avatar):
        return '🙂'
    return avatar

def _validate_question(text: str, max_len=200):
    text = str(text or '').strip()
    if len(text) < 2:
        return None, 'invalid_question'
    if len(text) > max_len:
        return None, 'question_too_long'
    if _has_forbidden_text(text):
        return None, 'question_forbidden_chars'
    return text, None

# ---------------------------------------------------------------------
# Orchestration des tours
# ---------------------------------------------------------------------
def advance_turn(room_id: str):
    room = rooms.get(room_id)
    if not room or "game" not in room:
        return
    g = room["game"]
    idx = g.get("turn_index", 0)
    turns = g.get("turns", [])
    
    # Marquer qu'on est en Phase 1 (pour le tracking du cycle)
    if g.get('phase') == 'phase1' and g.get('last_question_phase') is None:
        g['last_question_phase'] = 'phase1'

    if idx >= len(turns):
        socketio.emit("turn:end", {"roomId": room_id}, room=room_id)
        print(f"[turn] end -> start continue vote in {room_id}", flush=True)
        _start_continue_vote(room_id)
        return

    current = turns[idx]
    sids_in_room = {p["id"] for p in room["players"]}
    if current["q"] not in sids_in_room or current["t"] not in sids_in_room:
        g["turn_index"] += 1
        return advance_turn(room_id)

    socketio.emit("turn:new", {
        "roomId": room_id,
        "questionerId": current["q"],
        "targetId": current["t"],
        "index": idx,
        "total": len(turns),
    }, room=room_id)

def _emit_current_turn_to(room, sid):
    if not room or 'game' not in room:
        return
    g = room['game']
    idx = g.get('turn_index', 0)
    turns = g.get('turns', [])
    if idx >= len(turns):
        socketio.emit('turn:end', {'roomId': room['id']}, to=sid)
        return
    cur = turns[idx]
    socketio.emit('turn:new', {
        'roomId': room['id'],
        'questionerId': cur['q'],
        'targetId': cur['t'],
        'index': idx,
        'total': len(turns)
    }, to=sid)

def _delay_and_next(room_id: str):
    # ⚠️ ne pas bloquer le worker -> utiliser socketio.sleep
    socketio.sleep(5)
    room = rooms.get(room_id)
    if not room or "game" not in room:
        return
    room["game"]["turn_index"] += 1
    advance_turn(room_id)

# ---------------------------------------------------------------------
# Helpers rejoin / role / vote
# ---------------------------------------------------------------------
def _relink_sid(room, old_sid, new_sid):
    """Relie l'ancien SID au nouveau dans tout l'état de jeu en cours."""
    g = room.get('game') or {}
    if g.get('intruder_sid') == old_sid:
        g['intruder_sid'] = new_sid
    for t in g.get('turns', []):
        if t.get('q') == old_sid: t['q'] = new_sid
        if t.get('t') == old_sid: t['t'] = new_sid
    # ✅ recolle aussi les votes "continue"
    v = g.get('vote') or {}
    if v.get('kind') == 'continue' and isinstance(v.get('votes'), dict):
        if old_sid in v['votes']:
            v['votes'][new_sid] = v['votes'].pop(old_sid)

def _emit_setup_and_role(room, sid):
    g = room.get('game') or {}
    socketio.emit('game:setup', {
        "roomId": room.get("id"),
        "players": _public_players(room),
        "status": room.get("status"),
        "turn_index": g.get("turn_index", 0),
        "total_turns": len(g.get("turns", [])),
        "phase": g.get("phase")
    }, to=sid)

    is_intruder = (sid == g.get("intruder_sid"))
    role = {"isIntruder": is_intruder}
    if not is_intruder:
        role["animal"] = g.get("animal")
    socketio.emit('game:role', role, to=sid)
    print(f"[emit] game:role -> {sid} {'(intrus)' if is_intruder else '(non-intrus)'}", flush=True)

# ---------------- Vote "continuer ?" ----------------
def _start_continue_vote(room_id):
    room = rooms.get(room_id)
    if not room or "game" not in room:
        return
    g = room['game']
    g['phase'] = 'vote_continue'
    
    # Compter les joueurs en ligne
    total_online = sum(1 for p in room['players'] if not p.get('offline'))
    players_list = [(p.get('name', 'unknown'), p.get('offline', False)) for p in room['players']]
    print(f"[vote] Players status: {players_list}", flush=True)
    print(f"[vote] continue:start room={room_id} total={total_online}", flush=True)
    
    g['vote'] = {
        "kind": "continue",
        "votes": {},
        "expected": total_online,   # nombre attendu au départ
        "open": True,
        "startedAt": time.time()
    }
    socketio.emit(
        "vote:continue:start",
        {"roomId": room_id, "total": total_online},
        room=room_id
    )
    # ❌ NE PAS lancer de timeout automatique - le vote se termine uniquement quand tous ont voté
    # socketio.start_background_task(_continue_vote_timeout, room_id)

def _continue_vote_timeout(room_id):
    room = rooms.get(room_id)
    if not room or "game" not in room:
        return
    g = room['game']
    start_time = time.time()
    
    # Boucle qui vérifie l'état ACTUEL du vote à chaque itération
    while True:
        # Re-récupérer le vote à chaque fois pour voir les changements !
        v = g.get('vote') or {}
        
        if not v.get("open"):
            # Le vote a été fermé manuellement (tous ont voté)
            print(f"[vote] timeout loop: vote closed manually", flush=True)
            break
        
        if time.time() - start_time >= VOTE_CONTINUE_TIMEOUT:
            print(f"[vote] timeout -> closing room={room_id}", flush=True)
            _end_continue_vote(room)
            break
        
        socketio.sleep(1)

def _emit_vote_state_to(room, sid):
    if not room or "game" not in room:
        return
    g = room['game']
    vote = g.get('vote') or {}
    if vote.get('kind') != 'continue':
        return
    total = vote.get('expected') or sum(1 for p in room['players'] if not p.get('offline'))
    count = len(vote.get('votes', {}))
    yes = sum(1 for v in vote.get('votes', {}).values() if v == 'yes')
    no  = sum(1 for v in vote.get('votes', {}).values() if v == 'no')
    socketio.emit("vote:continue:start",  {"roomId": room['id'], "total": total, "timeout": VOTE_CONTINUE_TIMEOUT}, to=sid)
    socketio.emit("vote:continue:update", {"roomId": room['id'], "count": count, "total": total, "yes": yes, "no": no}, to=sid)

def _end_continue_vote(room):
    """Clôture le vote et enchaîne la suite."""
    print(f"[vote] _end_continue_vote called for room={room.get('id') if room else 'None'}", flush=True)
    
    if not room or "game" not in room:
        print(f"[vote] ERROR: room or game not found", flush=True)
        return
    
    g = room['game']; v = g.get('vote') or {}
    
    print(f"[vote] vote state: open={v.get('open')}, votes={len(v.get('votes', {}))}", flush=True)
    
    if not v.get("open"):
        print(f"[vote] WARNING: vote already closed, skipping", flush=True)
        return
    
    v["open"] = False
    print(f"[vote] vote closed, processing results...", flush=True)

    yes = sum(1 for x in v["votes"].values() if x == "yes")
    expected = v.get("expected") or sum(1 for p in room['players'] if not p.get('offline'))
    decision_continue = (yes > expected / 2.0)  # égalité => non

    socketio.emit("vote:continue:end", {
        "roomId": room["id"],
        "continue": decision_continue
    }, room=room["id"])
    print(f"[vote] end -> yes={yes} total={expected} continue={decision_continue}", flush=True)

    # Logique du jeu :
    # - Si majorité vote OUI → Passer au vote final (identification de l'intrus)
    # - Si majorité vote NON → TOUJOURS relancer Phase 2 de questions
    
    if decision_continue:
        # Majorité vote OUI → Passer au vote final
        print(f"[vote] majority YES -> starting final vote", flush=True)
        _start_final_vote(room["id"])
    else:
        # Majorité vote NON → Toujours relancer Phase 2 (questions déléguées)
        # Peu importe combien de fois, on reste en Phase 2 jusqu'à ce que majorité vote OUI
        print(f"[vote] majority NO -> restarting phase 2", flush=True)
        g['last_question_phase'] = 'phase2'
        _start_phase2(room["id"])

# ============ Phase 2 : Questions Déléguées ============
def _start_phase2(room_id):
    """Démarre la phase 2 où les joueurs se questionnent en chaîne."""
    room = rooms.get(room_id)
    if not room or 'game' not in room:
        return
    
    g = room['game']
    g['phase'] = 'phase2'
    
    # Liste des joueurs connectés
    sids = [p['id'] for p in room['players'] if not p.get('offline')]
    
    if len(sids) < 2:
        # Pas assez de joueurs → Passer au vote final
        print(f"[phase2] Not enough players, skipping to final vote", flush=True)
        _start_final_vote(room_id)
        return
    
    # Choisir un questionneur aléatoire pour démarrer
    random.shuffle(sids)
    first_questioner = sids[0]
    
    g['phase2_state'] = {
        'current_questioner': first_questioner,
        'current_target': None,
        'current_question': None,
        'previous_questioner': None,  # Pour éviter les retours immédiats A→B→A
        'all_players': sids.copy(),
        'turn_count': 0,
        'max_turns': len(sids) * 2  # Chaque joueur peut questionner plusieurs fois
    }
    
    # Émettre l'événement de démarrage
    socketio.emit("phase2:start", {
        "roomId": room_id,
        "players": _public_players(room),
        "totalTurns": len(sids)
    }, room=room_id)
    print(f"[phase2] start room={room_id} players={len(sids)}", flush=True)
    
    # Démarrer le premier tour
    _start_phase2_turn(room_id)

def _start_phase2_turn(room_id):
    """Démarre un nouveau tour de phase 2."""
    room = rooms.get(room_id)
    if not room or 'game' not in room:
        return
    
    g = room['game']
    state = g.get('phase2_state', {})
    
    questioner_sid = state.get('current_questioner')
    turn = state.get('turn_count', 0)
    max_turns = state.get('max_turns', 0)
    
    # Vérifier si la phase est terminée
    if turn >= max_turns:
        print(f"[phase2] end -> tous ont questionné", flush=True)
        socketio.emit("phase2:end", {"roomId": room_id}, room=room_id)
        _start_continue_vote(room_id)
        return
    
    # Vérifier que le questionneur est toujours connecté
    sids_in_room = {p["id"] for p in room["players"] if not p.get('offline')}
    if questioner_sid not in sids_in_room:
        # Questionneur déconnecté, passer au suivant
        all_players = state.get('all_players', [])
        remaining = [p for p in all_players if p in sids_in_room and p != questioner_sid]
        if remaining:
            state['current_questioner'] = remaining[0]
            return _start_phase2_turn(room_id)
        else:
            # Plus personne, terminer
            _start_continue_vote(room_id)
            return
    
    # Calculer les cibles disponibles : tous les joueurs SAUF le questionneur actuel et le questionneur précédent
    all_players = state.get('all_players', [])
    previous_questioner = state.get('previous_questioner')  # Celui qui vient de poser la question
    
    print(f"[phase2] DEBUG - all_players={all_players}", flush=True)
    print(f"[phase2] DEBUG - questioner_sid={questioner_sid}", flush=True)
    print(f"[phase2] DEBUG - previous_questioner={previous_questioner}", flush=True)
    print(f"[phase2] DEBUG - sids_in_room={sids_in_room}", flush=True)
    
    # Exclure : le questionneur lui-même ET le questionneur précédent (pour éviter A→B→A)
    available_targets = [
        p for p in all_players 
        if p in sids_in_room 
        and p != questioner_sid 
        and p != previous_questioner  # Ne peut pas cibler celui qui vient de l'interroger
    ]
    
    print(f"[phase2] DEBUG - available_targets={available_targets}", flush=True)
    
    # Émettre le tour actuel
    socketio.emit("phase2:turn", {
        "roomId": room_id,
        "questionerId": questioner_sid,
        "availableTargets": [{"id": tid} for tid in available_targets],
        "turnIndex": turn,
        "totalTurns": max_turns
    }, room=room_id)
    print(f"[phase2] turn {turn+1}/{max_turns} - questioner={questioner_sid}, available={len(available_targets)}", flush=True)

@socketio.on('phase2:ask')
def on_phase2_ask(data):
    """Reçoit une question déléguée."""
    data = data or {}
    room_id = data.get('roomId')
    target_sid = data.get('targetId')
    question, question_error = _validate_question(data.get('question', ''), max_len=200)
    
    # Validation de la question
    if question_error:
        return {'ok': False, 'reason': question_error}
    
    room = rooms.get(room_id)
    if not room or 'game' not in room:
        return {'ok': False}
    
    g = room['game']
    state = g.get('phase2_state', {})
    
    # Vérifier que c'est bien le questionneur
    if state.get('current_questioner') != request.sid:
        return {'ok': False, 'reason': 'not_your_turn'}
    
    # Vérifier que la cible est valide
    all_players = state.get('all_players', [])
    previous_questioner = state.get('previous_questioner')
    sids_in_room = {p["id"] for p in room["players"] if not p.get('offline')}
    
    if target_sid not in all_players or target_sid not in sids_in_room:
        return {'ok': False, 'reason': 'invalid_target'}
    
    if target_sid == request.sid:
        return {'ok': False, 'reason': 'cannot_ask_yourself'}
    
    # Vérifier qu'on ne cible pas le questionneur précédent (éviter A→B→A)
    if target_sid == previous_questioner:
        return {'ok': False, 'reason': 'cannot_target_previous_questioner'}
    
    # Enregistrer la question et la cible
    state['current_target'] = target_sid
    state['current_question'] = question
    
    # Émettre la question à tout le monde
    socketio.emit("phase2:asked", {
        "roomId": room_id,
        "questionerId": request.sid,
        "targetId": target_sid,
        "question": question
    }, room=room_id)
    
    print(f"[phase2] asked: {request.sid} -> {target_sid}: {question}", flush=True)
    return {'ok': True}

@socketio.on('phase2:answer')
def on_phase2_answer(data):
    """Reçoit une réponse déléguée (uniquement Oui ou Non)."""
    data = data or {}
    room_id = data.get('roomId')
    answer = data.get('answer', '').strip()
    
    # Validation : seulement "Oui" ou "Non"
    if answer not in ['Oui', 'Non']:
        return {'ok': False, 'reason': 'invalid_answer'}
    
    room = rooms.get(room_id)
    if not room or 'game' not in room:
        return {'ok': False}
    
    g = room['game']
    state = g.get('phase2_state', {})
    
    # Vérifier que c'est bien la cible
    if state.get('current_target') != request.sid:
        return {'ok': False, 'reason': 'not_the_target'}
    
    # Enregistrer la réponse
    current_target = state['current_target']
    current_questioner = state['current_questioner']
    
    # Émettre la réponse à tout le monde
    socketio.emit("phase2:answered", {
        "roomId": room_id,
        "targetId": request.sid,
        "answer": answer
    }, room=room_id)
    
    print(f"[phase2] answered: {request.sid}: {answer}", flush=True)
    
    # Sauvegarder le questionneur actuel comme "previous" pour éviter le retour immédiat (A→B→A)
    state['previous_questioner'] = current_questioner
    
    # La cible devient le nouveau questionneur
    state['current_questioner'] = current_target
    state['current_target'] = None
    state['current_question'] = None
    state['turn_count'] = state.get('turn_count', 0) + 1
    
    # ✅ Attendre 3 secondes avant de passer au tour suivant pour laisser le temps de lire
    print(f"[phase2] Answer received, waiting 3s before next turn in room {room_id}", flush=True)
    socketio.sleep(3)
    _start_phase2_turn(room_id)
    
    return {'ok': True}

# ============ Vote Final ============
def _start_final_vote(room_id):
    """Démarre le vote final pour désigner l'intrus."""
    room = rooms.get(room_id)
    if not room or 'game' not in room:
        return
    
    g = room['game']
    g['phase'] = 'final_vote'
    
    total_online = sum(1 for p in room['players'] if not p.get('offline'))
    intruder_sid = g.get('intruder_sid')
    
    # Générer une liste de 10 animaux pour l'intrus (incluant le bon)
    correct_animal = g.get('animal')
    # Créer une liste de 9 autres animaux aléatoires
    other_animals = [a for a in ANIMALS if a != correct_animal]
    random.shuffle(other_animals)
    animal_choices = other_animals[:9] + [correct_animal]
    random.shuffle(animal_choices)  # Mélanger pour que le bon ne soit pas toujours à la fin
    
    g['final_vote'] = {
        "votes": {},  # {sid: suspect_sid}
        "expected": total_online - 1,  # Tous sauf l'intrus
        "open": True,
        "intruder_guess": None,  # Réponse de l'intrus
        "animal_choices": animal_choices  # Liste des 10 animaux
    }
    
    # Envoyer les données aux joueurs normaux
    socketio.emit("final_vote:start", {
        "roomId": room_id,
        "suspects": _public_players(room),
        "total": total_online - 1  # Nombre de votes attendus (sans l'intrus)
    }, room=room_id, skip_sid=intruder_sid)
    
    # Envoyer les données à l'intrus (interface différente)
    if intruder_sid:
        socketio.emit("intruder:guess_animal", {
            "roomId": room_id,
            "animals": animal_choices
        }, to=intruder_sid)
    
    print(f"[final_vote] start room={room_id} voters={total_online - 1} intruder={intruder_sid}", flush=True)

@socketio.on('final_vote:cast')
def on_final_vote_cast(data):
    """Reçoit un vote final."""
    data = data or {}
    room_id = data.get('roomId') or data.get('RoomId')
    suspect_id = data.get('suspectId')
    
    print(f"[final_vote] cast from {request.sid} suspect={suspect_id} room={room_id}", flush=True)
    
    room = rooms.get(room_id)
    if not room or 'game' not in room:
        return {'ok': False, 'reason': 'room_not_found'}
    
    g = room['game']
    fv = g.get('final_vote') or {}
    
    if not fv.get('open'):
        return {'ok': False, 'reason': 'not_open'}
    
    if not suspect_id:
        return {'ok': False, 'reason': 'no_suspect'}
    
    # VALIDATION : Un joueur ne peut pas voter pour lui-même
    if suspect_id == request.sid:
        print(f"[final_vote] ERROR: player {request.sid} tried to vote for themselves", flush=True)
        return {'ok': False, 'reason': 'cannot_vote_for_yourself'}
    
    # Vérifier que le suspect existe dans la room
    if not any(p['id'] == suspect_id for p in room['players']):
        return {'ok': False, 'reason': 'invalid_suspect'}
    
    # Enregistrer le vote
    fv['votes'][request.sid] = suspect_id
    
    count = len(fv['votes'])
    total = fv.get('expected', 0)
    
    socketio.emit('final_vote:update', {
        'roomId': room_id,
        'count': count,
        'total': total
    }, room=room_id)
    print(f"[final_vote] update: {count}/{total}", flush=True)
    
    # Vérifier si tous les votes NORMAUX sont reçus ET si l'intrus a répondu
    intruder_guess = fv.get('intruder_guess')
    
    if count >= total and intruder_guess is not None:
        # Tout le monde a fini (votes + intrus)
        print(f"[final_vote] All votes ({count}/{total}) + intruder guess received -> ending", flush=True)
        _end_final_vote(room)
    elif count >= total:
        # Les votes sont complets mais on attend l'intrus
        print(f"[final_vote] All votes received, waiting for intruder guess...", flush=True)
    
    return {'ok': True, 'count': count, 'total': total}

@socketio.on('intruder:submit_guess')
def on_intruder_guess(data):
    """Reçoit la réponse de l'intrus pour deviner l'animal."""
    data = data or {}
    room_id = data.get('roomId') or data.get('RoomId')
    guessed_animal = data.get('animal')
    
    print(f"[intruder] guess from {request.sid} animal={guessed_animal} room={room_id}", flush=True)
    
    room = rooms.get(room_id)
    if not room or 'game' not in room:
        return {'ok': False, 'reason': 'room_not_found'}
    
    g = room['game']
    fv = g.get('final_vote') or {}
    
    # Vérifier que c'est bien l'intrus
    if request.sid != g.get('intruder_sid'):
        return {'ok': False, 'reason': 'not_intruder'}
    
    if not fv.get('open'):
        return {'ok': False, 'reason': 'not_open'}
    
    # Enregistrer la réponse de l'intrus
    fv['intruder_guess'] = guessed_animal
    
    print(f"[intruder] guess recorded: {guessed_animal}", flush=True)
    
    # Vérifier si tous les joueurs ET l'intrus ont répondu
    votes_count = len(fv.get('votes', {}))
    expected_votes = fv.get('expected', 0)
    
    if votes_count >= expected_votes and fv['intruder_guess'] is not None:
        # Tout le monde a fini -> calculer résultats
        print(f"[final_vote] All votes + intruder guess received -> ending", flush=True)
        _end_final_vote(room)
    
    return {'ok': True, 'guessed': guessed_animal}

def _end_final_vote(room):
    """Clôture le vote final et calcule les résultats."""
    if not room or 'game' not in room:
        return
    
    g = room['game']
    fv = g.get('final_vote') or {}
    
    if not fv.get('open'):
        return
    
    fv['open'] = False
    
    socketio.emit("final_vote:end", {"roomId": room["id"]}, room=room["id"])
    print(f"[final_vote] end room={room['id']}", flush=True)
    
    # Calculer les résultats
    _calculate_and_send_results(room)

def _calculate_and_send_results(room):
    """Calcule les scores et envoie les résultats."""
    if not room or 'game' not in room:
        return
    
    g = room['game']
    fv = g.get('final_vote') or {}
    votes = fv.get('votes', {})
    
    # Compter les votes
    vote_counts = {}
    for suspect_id in votes.values():
        vote_counts[suspect_id] = vote_counts.get(suspect_id, 0) + 1
    
    # Trouver le plus voté
    most_voted_id = None
    max_votes = 0
    for suspect_id, count in vote_counts.items():
        if count > max_votes:
            max_votes = count
            most_voted_id = suspect_id
    
    # Déterminer si l'intrus a été découvert
    intruder_sid = g.get('intruder_sid')
    intruder_caught = (most_voted_id == intruder_sid)
    
    # Vérifier si l'intrus a trouvé le bon animal
    correct_animal = g.get('animal')
    intruder_guess = fv.get('intruder_guess')
    intruder_guessed_correctly = (intruder_guess == correct_animal)
    
    # Formater l'animal pour l'affichage (nom + emoji)
    if isinstance(correct_animal, dict):
        correct_animal_display = f"{correct_animal.get('name', '')} {correct_animal.get('emoji', '')}".strip()
    else:
        correct_animal_display = str(correct_animal) if correct_animal else '—'
    
    print(f"[results] intruder guess: {intruder_guess}, correct: {correct_animal}, match: {intruder_guessed_correctly}", flush=True)
    
    # Calculer les scores
    scores = {}
    winners = []
    
    for player in room['players']:
        pid = player['id']
        
        if pid == intruder_sid:
            # L'intrus : 3 points s'il a trouvé le bon animal, sinon 0
            if intruder_guessed_correctly:
                scores[pid] = 3
                winners.append(pid)
            else:
                scores[pid] = 0
        else:
            # Les joueurs : 3 points s'ils ont voté pour le bon intrus, sinon 0
            if votes.get(pid) == intruder_sid:
                scores[pid] = 3
                winners.append(pid)
            else:
                scores[pid] = 0
    
    # Trouver l'objet intrus
    intruder_obj = next((p for p in room['players'] if p['id'] == intruder_sid), None)
    
    # Ajouter les scores à la room pour le cumul
    if 'cumulative_scores' not in room:
        room['cumulative_scores'] = {}
    
    for pid, score in scores.items():
        room['cumulative_scores'][pid] = room['cumulative_scores'].get(pid, 0) + score
    
    room['games_played'] = room.get('games_played', 0) + 1
    
    # Préparer les scores cumulés pour l'affichage
    cumulative_scores = room['cumulative_scores'].copy()
    games_played = room['games_played']
    
    # Émettre les résultats
    socketio.emit("game:results", {
        "roomId": room["id"],
        "intruder": {
            "id": intruder_obj.get('id') if intruder_obj else None,
            "name": intruder_obj.get('name') if intruder_obj else 'Inconnu',
            "avatar": intruder_obj.get('avatar') if intruder_obj else '🕵️'
        },
        "intruderCaught": intruder_caught,
        "intruderGuessedCorrectly": intruder_guessed_correctly,
        "correctAnimal": correct_animal_display,
        "intruderGuess": intruder_guess,
        "votes": votes,
        "voteCounts": vote_counts,
        "mostVoted": most_voted_id,
        "scores": scores,  # Scores de cette partie
        "cumulativeScores": cumulative_scores,  # Scores totaux
        "gamesPlayed": games_played,  # Nombre de parties jouées
        "winners": winners
    }, room=room["id"])
    
    print(f"[results] sent: intruder_caught={intruder_caught}, intruder_guessed={intruder_guessed_correctly}, scores={scores}, cumulative={cumulative_scores}, games={games_played}, winners={winners}", flush=True)
    
    g['phase'] = 'results'

# ---------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------
@app.route('/')
def serve_index():
    return send_from_directory(app.root_path, 'index.html')

@app.route('/salle')
def serve_salle():
    return send_from_directory(app.static_folder, 'salle.html')

@app.route('/join')
def serve_join():
    return send_from_directory(app.static_folder, 'copieID.html')

@app.route('/game')
def serve_game():
    return send_from_directory(app.root_path, 'game.html')

@app.route('/src/<path:filename>')
def serve_src(filename):
    return send_from_directory(os.path.join(app.root_path, 'src'), filename)

@app.route('/health')
def health():
    return "ok", 200

# ---------------------------------------------------------------------
# REST
# ---------------------------------------------------------------------
@app.route('/api/rooms', methods=['POST'])
def create_room():
    room_id = gen_room_id()
    rooms[room_id] = {'id': room_id, 'players': [], 'status': 'waiting', 'host_id': None}
    return jsonify(roomId=room_id), 201

@app.route('/api/rooms/<room_id>', methods=['GET'])
def check_room(room_id):
    room = rooms.get(room_id)
    if not room:
        abort(404, description="Salle introuvable")
    return jsonify(roomId=room['id'], playerCount=len(room['players']), status=room['status'])

# ---------------------------------------------------------------------
# Socket.IO
# ---------------------------------------------------------------------
@socketio.on('connect')
def on_connect():
    print('Client connecté :', request.sid, flush=True)

@socketio.on('disconnect')
def on_disconnect():
    disconnected_player_name = None
    disconnected_room_id = None
    
    for room_id, room in list(rooms.items()):
        for p in list(room['players']):
            if p['id'] == request.sid:
                disconnected_player_name = p.get('name', 'Un joueur')
                disconnected_room_id = room_id
                
                if room['status'] == 'started':
                    p['offline'] = True
                    leave_room(room_id)

                    # ✅ si un vote "continue" est ouvert, ajuster l'attendu
                    g = room.get('game') or {}
                    v = g.get('vote') or {}
                    if v.get('kind') == 'continue' and v.get('open'):
                        # s'il n'avait pas voté, on réduit l'attendu
                        if request.sid not in v.get('votes', {}):
                            v['expected'] = max(0, (v.get('expected') or 0) - 1)
                            # si plus personne n'est attendu, on clôture
                            if len(v.get('votes', {})) >= v['expected']:
                                _end_continue_vote(room)

                    socketio.emit('room:update', _public_players(room), room=room_id)
                    
                    # ✅ Vérifier si on peut encore jouer (>= 3 joueurs en ligne)
                    online_players = [pl for pl in room['players'] if not pl.get('offline')]
                    if len(online_players) < 3:
                        # Impossible de continuer, notifier les joueurs restants
                        socketio.emit('player:left', {
                            'roomId': room_id,
                            'playerName': disconnected_player_name,
                            'remainingPlayers': len(online_players),
                            'canContinue': False
                        }, room=room_id)
                    else:
                        # On peut encore jouer
                        socketio.emit('player:left', {
                            'roomId': room_id,
                            'playerName': disconnected_player_name,
                            'remainingPlayers': len(online_players),
                            'canContinue': True
                        }, room=room_id)
                else:
                    room['players'] = [pl for pl in room['players'] if pl['id'] != request.sid]
                    leave_room(room_id)
                    socketio.emit('room:update', _public_players(room), room=room_id)
                break
    
    print(f'Client déconnecté : {request.sid} ({disconnected_player_name})', flush=True)

@socketio.on('server:error')
def _noop(_=None):
    pass

@socketio.on('room:create')
def on_room_create(data):
    data = data or {}
    room_id = data.get('roomId')
    name, name_error = _validate_player_name(data.get('name'))
    avatar = _clean_avatar(data.get('avatar'))
    
    # Validation du pseudo
    if name_error:
        socketio.emit('server:error', {'msg': name_error}, room=request.sid)
        return

    room = rooms.get(room_id)
    if not room:
        socketio.emit('server:error', {'msg': 'Salle introuvable'}, room=request.sid)
        return
    if room['status'] != 'waiting':
        socketio.emit('server:error', {'msg': 'La partie a déjà commencé'}, room=request.sid)
        return
    if len(room['players']) >= MAX_PLAYERS:
        socketio.emit('server:error', {'msg': 'Salle pleine'}, room=request.sid)
        return
    
    # Vérification de l'unicité du pseudo
    if any(p['name'].strip().lower() == name.lower() for p in room['players']):
        socketio.emit('server:error', {'msg': f'Le pseudo "{name}" est déjà utilisé. Choisissez-en un autre.'}, room=request.sid)
        return

    room['host_id'] = room.get('host_id') or request.sid
    if not _player_in_room(room, request.sid):
        room['players'].append({'id': request.sid, 'name': name, 'avatar': avatar, 'offline': False})
    join_room(room_id)
    socketio.emit('room:update', _public_players(room), room=room_id)

@socketio.on('room:join')
def on_room_join(data):
    """
    data: { roomId, name, avatar, rejoin? }
    """
    data = data or {}
    room_id = data.get('roomId') or data.get('RoomId')
    name, name_error = _validate_player_name(data.get('name'))
    avatar = _clean_avatar(data.get('avatar'))
    rejoin = bool(data.get('rejoin'))
    
    # Validation du pseudo pour les nouveaux joueurs
    if name_error:
        socketio.emit('server:error', {'msg': name_error}, room=request.sid)
        return

    room = rooms.get(room_id)
    if not room:
        socketio.emit('server:error', {'msg': 'Salle introuvable'}, room=request.sid)
        return

    # ---------- REJOIN ----------
    if rejoin:
        player = next((p for p in room['players'] if (p.get('name') or '').strip().lower() == name.lower()), None)
        if not player:
            socketio.emit('server:error', {'msg': 'Impossible de recoller: joueur inconnu'}, room=request.sid)
            return

        old_sid = player['id']
        was_host = (room.get('host_id') == old_sid)

        player['id'] = request.sid
        player['offline'] = False
        if was_host:
            room['host_id'] = request.sid

        join_room(room_id)

        if room.get('status') == 'started' and room.get('game'):
            _relink_sid(room, old_sid, request.sid)
            _emit_setup_and_role(room, request.sid)

            g = room['game']
            if g.get('phase') == 'phase1':
                _emit_current_turn_to(room, request.sid)
            elif g.get('phase') == 'vote_continue':
                _emit_vote_state_to(room, request.sid)

        socketio.emit('room:update', _public_players(room), room=room_id)
        return

    # ---------- JOIN initial ----------
    if room['status'] != 'waiting':
        socketio.emit('server:error', {'msg': 'Impossible de rejoindre, partie déjà démarrée'}, room=request.sid)
        return
    if len(room['players']) >= MAX_PLAYERS:
        socketio.emit('server:error', {'msg': 'Salle pleine'}, room=request.sid)
        return
    
    # Vérification de l'unicité du pseudo
    if any(p['name'].strip().lower() == name.lower() for p in room['players']):
        socketio.emit('server:error', {'msg': f'Le pseudo "{name}" est déjà utilisé. Choisissez-en un autre.'}, room=request.sid)
        return

    room['players'].append({'id': request.sid, 'name': name, 'avatar': avatar, 'offline': False})
    join_room(room_id)
    socketio.emit('room:update', _public_players(room), room=room_id)

def _initialize_new_game(room_id):
    """Fonction interne pour initialiser une nouvelle partie dans une salle existante."""
    room = rooms.get(room_id)
    if not room:
        return False
    
    players = room['players']
    sids = [p['id'] for p in players]

    animal = random.choice(ANIMALS)
    intruder_sid = random.choice(sids)

    room['status'] = 'started'
    
    # Réinitialiser les votes pour rejouer (important pour la prochaine partie)
    room['play_again_votes'] = set()
    
    # Initialiser les scores cumulés s'ils n'existent pas
    if 'cumulative_scores' not in room:
        room['cumulative_scores'] = {p['id']: 0 for p in players}
        room['games_played'] = 0
    
    room['game'] = {
        'animal': animal,
        'intruder_sid': intruder_sid,
        'turns': build_turns(sids),
        'turn_index': 0,
        'log': [],
        'phase': 'phase1',
        'last_question_phase': None,  # Initialiser pour gérer le cycle Phase1 → Phase2
        'ready_players': set(),  # Joueurs qui ont cliqué sur "Suivant"
        'phase_started': False,  # La phase de questions a-t-elle vraiment commencé ?
    }

    socketio.emit('room:started', {'roomId': room_id}, room=room_id)

    for p in players:
        _emit_setup_and_role(room, p['id'])

    # NE PAS appeler advance_turn ici - on attend que tous soient prêts
    # advance_turn(room_id)
    return True


@socketio.on('room:start')
def on_room_start(data):
    room_id = (data.get('roomId') if isinstance(data, dict) else data) or None
    room = rooms.get(room_id)
    if not room:
        socketio.emit('server:error', {'msg': 'Salle introuvable'}, room=request.sid); return
    if request.sid != room.get('host_id'):
        socketio.emit('server:error', {'msg': "Seul l'hôte peut démarrer."}, room=request.sid); return
    if len(room['players']) < 3:
        socketio.emit('server:error', {'msg': 'Au moins 3 joueurs requis (min 3).'}, room=request.sid); return

    _initialize_new_game(room_id)

# ---------------- Ready Check (tous les joueurs prêts) ----------------
@socketio.on('player:ready')
def on_player_ready(data):
    """Un joueur a cliqué sur 'Suivant' et est prêt pour la phase de questions."""
    data = data or {}
    room_id = data.get('roomId') or data.get('RoomId')
    room = rooms.get(room_id)
    if not room or 'game' not in room:
        return
    
    g = room['game']
    
    # Ajouter le joueur aux joueurs prêts
    if 'ready_players' not in g:
        g['ready_players'] = set()
    
    g['ready_players'].add(request.sid)
    
    # Compter les joueurs en ligne
    online_players = [p for p in room['players'] if not p.get('offline')]
    ready_count = len(g['ready_players'])
    total_count = len(online_players)
    
    print(f"[ready] {ready_count}/{total_count} players ready in room {room_id}", flush=True)
    
    # Émettre la mise à jour du compteur
    socketio.emit('ready:update', {
        'roomId': room_id,
        'ready': ready_count,
        'total': total_count
    }, room=room_id)
    
    # Si tous les joueurs sont prêts, démarrer la phase
    if ready_count >= total_count and not g.get('phase_started'):
        g['phase_started'] = True
        print(f"[ready] All players ready, starting phase 1 in room {room_id}", flush=True)
        
        # Notifier que la phase commence
        socketio.emit('phase:start', {'roomId': room_id}, room=room_id)
        
        # Attendre un court instant pour que le frontend reçoive phase:start et active les contrôles
        socketio.sleep(0.5)
        
        # Démarrer le premier tour
        advance_turn(room_id)

# ---------------- Phase 1 : Q/A ----------------
@socketio.on('question:ask')
def on_question_ask(data):
    data = data or {}
    room_id = data.get('RoomId') or data.get('roomId')
    text, text_error = _validate_question(data.get('text', ''), max_len=200)
    room = rooms.get(room_id)
    if not room or 'game' not in room or text_error:
        return
    g = room['game']
    
    # Vérifier que la phase a bien démarré
    if not g.get('phase_started'):
        socketio.emit('server:error', {'msg': 'Attendez que tous les joueurs soient prêts'}, room=request.sid)
        return
    
    idx = g.get('turn_index', 0)
    turns = g.get('turns', [])
    if idx >= len(turns):
        return
    current = turns[idx]
    if request.sid != current['q']:
        return

    socketio.emit('question:ask', {
        'roomId': room_id, 'from': current['q'], 'to': current['t'], 'text': text
    }, room=room_id)

@socketio.on('question:answer')
def on_question_answer(data):
    data = data or {}
    room_id = data.get('RoomId') or data.get('roomId')
    answer = data.get('answer')
    if answer not in ('yes', 'no', 'Oui', 'Non'):
        return
    room = rooms.get(room_id)
    if not room or 'game' not in room:
        return
    g = room['game']
    idx = g.get('turn_index', 0)
    turns = g.get('turns', [])
    if idx >= len(turns):
        return
    current = turns[idx]
    if request.sid != current['t']:
        return

    socketio.emit('question:answer', {
        'roomId': room_id, 'from': current['t'], 'to': current['q'], 'answer': answer
    }, room=room_id)

    # ✅ Attendre 3 secondes avant de passer au tour suivant pour laisser le temps de lire
    print(f"[phase1] Answer received, waiting 3s before next turn in room {room_id}", flush=True)
    socketio.sleep(3)
    
    # Passer au tour suivant
    room["game"]["turn_index"] += 1
    advance_turn(room_id)

# ---------------- Vote "continuer ?" : cast ----------------
@socketio.on('vote:continue:cast')
def on_vote_continue_cast(data):
    data = data or {}
    room_id = data.get('roomId') or data.get('RoomId')
    choice  = (data.get('choice') or '').strip().lower()  # 'yes' | 'no'
    print(f"[vote] cast from {request.sid} choice={choice} room={room_id}", flush=True)

    room = rooms.get(room_id)
    if not room:
        print("[vote] room not found", flush=True)
        return {'ok': False, 'reason': 'room_not_found'}

    if 'game' not in room:
        print("[vote] no game in room", flush=True)
        return {'ok': False, 'reason': 'no_game'}

    g = room['game']
    v = g.get('vote') or {}

    if v.get('kind') != 'continue' or not v.get('open'):
        print("[vote] ignoring: vote not started/open", flush=True)
        return {'ok': False, 'reason': 'not_started'}

    if choice not in ('yes', 'no'):
        return {'ok': False, 'reason': 'bad_choice'}

    if not any(p['id'] == request.sid for p in room['players']):
        return {'ok': False, 'reason': 'not_in_room'}

    if request.sid in v['votes']:
        # renvoie l'état actuel sans re-compter
        yes = sum(1 for x in v['votes'].values() if x == 'yes')
        no  = sum(1 for x in v['votes'].values() if x == 'no')
        return {'ok': True, 'count': len(v['votes']), 'total': v.get('expected', 0), 'yes': yes, 'no': no}

    # --------- enregistre le vote ----------
    v['votes'][request.sid] = choice

    yes = sum(1 for x in v['votes'].values() if x == 'yes')
    no  = sum(1 for x in v['votes'].values() if x == 'no')
    count = len(v['votes'])
    total = v.get('expected', 0)  # Utiliser le total attendu fixé au démarrage

    socketio.emit('vote:continue:update', {
        'roomId': room_id, 'count': count, 'total': total, 'yes': yes, 'no': no
    }, room=room_id)
    print(f"[vote] update: {count}/{total} (yes={yes}, no={no})", flush=True)

    # si tout le monde attendu a voté -> fin
    if count >= total:
        print(f"[vote] ALL VOTES RECEIVED ({count}/{total}) -> calling _end_continue_vote", flush=True)
        _end_continue_vote(room)
    else:
        print(f"[vote] waiting for more votes ({count}/{total})", flush=True)

    # ---> ACK renvoyé au client qui a cliqué
    return {'ok': True, 'count': count, 'total': total, 'yes': yes, 'no': no}

# ---------------------------------------------------------------------
# Purge optionnelle (non utilisée ici)
# ---------------------------------------------------------------------
def _purge_room_later(room_id, delay=30):
    socketio.sleep(delay)
    room = rooms.get(room_id)
    if not room:
        return
    if room['status'] == 'waiting' and not room['players']:
        rooms.pop(room_id, None)
        print(f"Salle {room_id} supprimée après inactivité.", flush=True)

# ---------------------------------------------------------------------
# Continuer à jouer (nouvelle partie avec mêmes joueurs)
# ---------------------------------------------------------------------
@socketio.on('play:again')
def on_play_again(data):
    """Un joueur vote pour continuer à jouer."""
    data = data or {}
    room_id = data.get('roomId') or data.get('RoomId')
    
    room = rooms.get(room_id)
    if not room:
        return {'ok': False, 'reason': 'room_not_found'}
    
    # Initialiser le compteur de votes pour rejouer
    if 'play_again_votes' not in room:
        room['play_again_votes'] = set()
    
    # Ajouter le vote du joueur
    room['play_again_votes'].add(request.sid)
    
    count = len(room['play_again_votes'])
    total = sum(1 for p in room['players'] if not p.get('offline'))
    
    print(f"[play_again] {count}/{total} votes in room {room_id}", flush=True)
    
    # Émettre la mise à jour du compteur
    socketio.emit('play:again:update', {
        'roomId': room_id,
        'count': count,
        'total': total
    }, room=room_id)
    
    # Si tout le monde a voté, relancer le jeu
    if count >= total:
        print(f"[play_again] All players ready, restarting game in {room_id}", flush=True)
        
        # Notifier les joueurs AVANT de réinitialiser les votes
        socketio.emit('play:again:confirmed', {'roomId': room_id}, room=room_id)
        
        # Redémarrer automatiquement après 2 secondes
        # Les votes seront réinitialisés dans _initialize_new_game
        socketio.sleep(2)
        _initialize_new_game(room_id)
    
    return {'ok': True, 'count': count, 'total': total}

