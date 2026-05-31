// src/js/game-state.js

// Gestion centralisée de l'état du jeu (online/offline)
class GameState {
  constructor() {
    // --- État général
    this.players = [];            // [{id,name,avatar,offline?}]
    this.currentRoom = null;      // roomId
    this.gamePhase = 'lobby';     // 'lobby' | 'roles' | 'phase1' | 'phase2' | 'finalVote' | 'results'
    this.mode = 'offline';        // 'online' | 'offline'

    // --- Identité locale (pour recoller sans backend)
    this.currentPlayer = null;    // objet player courant (pour l'UI)
    this.currentPlayerName = null; // nom retenu (ex: ctx.name)
    this.mySid = null;            // SID (si on veut l'utiliser)

    // --- Rôle & secret
    this.roles = {};              // { [playerId]: { isIntruder, animal? } }
    this.secretAnimal = null;
    this.intruder = null;         // {id,...} (offline) | null

    // --- Buffers/flags (important pour la course de vitesse setup↔role)
    this._pendingRole = null;     // rôle reçu avant d'avoir currentPlayer

    // --- Phase 1 / 2 / votes (surtout offline)
    this.questions = [];
    this.votes = {};              // { [playerId]: 'yes'|'no' | suspectId }
    this.scores = {};             // { [playerId]: number }
    this.currentTurn = 0;
    this.phase1Pairs = [];
    this.phase2Participants = [];

    // --- Données demo offline
    this.animals = ['🐢', '🦊', '🐯', '🐻', '🐧', '🦁', '🐼', '🦆', '🐨', '🐸'];
    this.playerAvatars = ['🦊', '🐯', '🐻', '🐧', '🦁', '🐼', '🦆', '🐨', '🐸', '🐮'];
  }

  // -------------------------------------------------------
  // Helpers d'événements (UI réagit via document.addEventListener)
  _emit(name, detail) {
    try { document.dispatchEvent(new CustomEvent(name, { detail })); } catch {}
  }

  // ========= API utilisée par le front online =========
  setMode(mode) {
    this.mode = mode || 'online';
  }

  setRoom(roomId) {
    this.currentRoom = roomId || null;
  }

  setPlayers(players) {
    // Normalisation légère
    this.players = Array.isArray(players)
      ? players.map(p => ({ id: p.id, name: p.name, avatar: p.avatar, offline: !!p.offline }))
      : [];

    // Recalage du currentPlayer après une mise à jour de la liste
    if (this.currentPlayerName) {
      this.setCurrentPlayerByName(this.currentPlayerName); // remet l'objet depuis la nouvelle liste
    } else if (this.currentPlayer) {
      const byId = this.players.find(p => p.id === this.currentPlayer.id);
      this.currentPlayer = byId || null;
    }

    this._emit('state:players', this.players);

    // Si un rôle était en attente (arrivé avant qu'on sache qui est "moi"), on l'applique maintenant
    if (this._pendingRole && this.currentPlayer) {
      const pr = this._pendingRole;
      this._pendingRole = null;
      this.setMyRole(pr); // relance setMyRole proprement
    }
  }

  setCurrentPlayerBySid(sid) {
    this.mySid = sid || null;
    const p = this.players.find(x => x.id === sid);
    if (p) this.currentPlayer = p;

    // Si un rôle était en attente, applique-le maintenant
    if (this._pendingRole && this.currentPlayer) {
      const pr = this._pendingRole;
      this._pendingRole = null;
      this.setMyRole(pr);
    }
  }

  setCurrentPlayerByName(name) {
    this.currentPlayerName = (name || '').trim();
    const n = this.currentPlayerName.toLowerCase();
    const p = this.players.find(x => (x.name || '').toLowerCase() === n);
    this.currentPlayer = p || null;

    // Si un rôle était en attente, applique-le maintenant
    if (this._pendingRole && this.currentPlayer) {
      const pr = this._pendingRole;
      this._pendingRole = null;
      this.setMyRole(pr);
    }
  }

  setMyRole({ isIntruder, animal }) {
    // Online : on écrit le rôle sur l'ID du joueur courant.
    // Si on ne sait pas encore qui est "moi", on bufferise.
    if (!this.currentPlayer) {
      this._pendingRole = { isIntruder, animal };
      return;
    }

    const id = this.currentPlayer.id;
    this.roles[id] = { isIntruder: !!isIntruder, animal: animal || null };

    if (isIntruder) {
      this.intruder = this.currentPlayer;
    } else if (animal) {
      this.secretAnimal = animal;
    }

    this.gamePhase = 'roles';
    this._emit('state:role', this.roles[id]);
  }

  getMyRole() {
    if (!this.currentPlayer) return this._pendingRole || null;
    return this.roles[this.currentPlayer.id] || this._pendingRole || null;
  }

  // Compat ancien code
  getCurrentPlayerRole() {
    return this.getMyRole();
  }

  getPlayerById(id) {
    // tolère string/number
    return this.players.find(p => p.id == id) || null;
  }

  amI(id) {
    return this.currentPlayer && (this.currentPlayer.id === id);
  }

  // Aliases utiles pour le reste du front
  get roomId() {
    return this.currentRoom;
  }

  // ====================== Mode "offline" (facultatif) ======================

  // Room Management (offline)
  createRoom() {
    this.currentRoom = this.generateRoomId();
    this.players = [];
    this.gamePhase = 'lobby';
    return this.currentRoom;
  }

  joinRoom(roomId) {
    this.currentRoom = roomId;
    this.gamePhase = 'lobby';
    return true;
  }

  generateRoomId() {
    const prefixes = ['INTRUS', 'GAME', 'PLAY', 'ROOM'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${suffix}`;
  }

  // Player Management (offline)
  addPlayer(name) {
    if (this.players.length >= 8) return false;

    const avatar = this.playerAvatars[this.players.length % this.playerAvatars.length];
    const player = {
      id: String(Date.now() + Math.random()), // string pour rester cohérent avec les SIDs
      name: (name || '').trim(),
      avatar,
      isIntruder: false,
      score: 0
    };

    this.players.push(player);
    if (!this.currentPlayer) this.currentPlayer = player;
    return player;
  }

  removePlayer(playerId) {
    this.players = this.players.filter(p => p.id != playerId);
    if (this.currentPlayer && this.currentPlayer.id == playerId) {
      this.currentPlayer = this.players[0] || null;
    }
  }

  // Game Setup (offline)
  startGame() {
    if (this.players.length < 3) return false;
    this.assignRoles();
    this.generatePhase1Pairs();
    this.gamePhase = 'roles';
    return true;
  }

  assignRoles() {
    // Choose secret animal
    this.secretAnimal = this.animals[Math.floor(Math.random() * this.animals.length)];

    // Choose intruder
    const intruderIndex = Math.floor(Math.random() * this.players.length);
    this.intruder = this.players[intruderIndex];
    this.intruder.isIntruder = true;

    // Set roles
    this.roles = {};
    this.players.forEach(player => {
      this.roles[player.id] = {
        isIntruder: !!player.isIntruder,
        animal: player.isIntruder ? null : this.secretAnimal
      };
    });
  }

  generatePhase1Pairs() {
    // Crée toutes les paires possibles pour la phase 1 (offline)
    this.phase1Pairs = [];
    for (let i = 0; i < this.players.length; i++) {
      for (let j = 0; j < this.players.length; j++) {
        if (i !== j) {
          this.phase1Pairs.push({
            questioner: this.players[i],
            target: this.players[j],
            question: null,
            answer: null
          });
        }
      }
    }
    this.currentTurn = 0;
  }

  // Phase Management (offline)
  getCurrentPhase1Pair() {
    return this.phase1Pairs[this.currentTurn] || null;
  }

  submitPhase1Question(question) {
    const currentPair = this.getCurrentPhase1Pair();
    if (!currentPair) return false;
    currentPair.question = question;
    return true;
  }

  submitPhase1Answer(answer) {
    const currentPair = this.getCurrentPhase1Pair();
    if (!currentPair) return false;
    currentPair.answer = answer;
    this.questions.push({ ...currentPair, timestamp: Date.now() });
    return true;
  }

  nextPhase1Turn() {
    this.currentTurn++;
    return this.currentTurn < this.phase1Pairs.length;
  }

  // Vote Management (offline)
  submitContinueVote(playerId, vote) {
    this.votes[playerId] = vote; // 'yes' | 'no'
    const voteCount = Object.keys(this.votes).length;

    if (voteCount === this.players.length) {
      const yesVotes = Object.values(this.votes).filter(v => v === 'yes').length;
      const shouldContinue = yesVotes > this.players.length / 2;

      if (shouldContinue) {
        this.setupPhase2();
        this.gamePhase = 'phase2';
      } else {
        this.gamePhase = 'finalVote';
      }
      return { complete: true, continue: shouldContinue };
    }
    return { complete: false, count: voteCount };
  }

  setupPhase2() {
    this.phase2Participants = this.players.filter(p => this.votes[p.id] === 'yes');
    this.currentTurn = 0;
  }

  submitFinalVote(playerId, suspectId) {
    this.votes[playerId] = suspectId; // id du suspect
    const voteCount = Object.keys(this.votes).length;

    if (voteCount === this.players.length) {
      this.calculateResults();
      this.gamePhase = 'results';
      return { complete: true };
    }
    return { complete: false, count: voteCount };
  }

  calculateResults() {
    // Compter les votes
    const voteCount = {};
    Object.values(this.votes).forEach(vote => {
      voteCount[vote] = (voteCount[vote] || 0) + 1;
    });

    // Trouver le plus voté
    let mostVoted = null;
    let maxVotes = 0;
    Object.entries(voteCount).forEach(([playerId, n]) => {
      if (n > maxVotes) {
        maxVotes = n;
        mostVoted = playerId;
      }
    });

    // Scores
    const intruderId = this.intruder ? String(this.intruder.id) : null;
    const intruderCaught = intruderId && (String(mostVoted) === intruderId);

    this.scores = {};
    this.players.forEach(player => {
      const pid = String(player.id);
      if (player.isIntruder) {
        this.scores[pid] = intruderCaught ? 0 : 3;
      } else {
        this.scores[pid] = intruderCaught ? 2 : 0;
        if (intruderId && String(this.votes[pid]) === intruderId) {
          this.scores[pid] += 1; // bonus bon vote
        }
      }
    });
  }

  // Reset complet
  reset() {
    this.players = [];
    this.currentRoom = null;
    this.currentPlayer = null;
    this.currentPlayerName = null;
    this.mySid = null;

    this.gamePhase = 'lobby';
    this.roles = {};
    this.secretAnimal = null;
    this.intruder = null;
    this._pendingRole = null;

    this.questions = [];
    this.votes = {};
    this.scores = {};
    this.currentTurn = 0;
    this.phase1Pairs = [];
    this.phase2Participants = [];
  }
}

// Instance globale (utilisée par realtime.js et les écrans)
window.gameState = new GameState();
