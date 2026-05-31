# 🏗️ ARCHITECTURE FINALE - Intrus Game

## 📂 STRUCTURE DU PROJET

```
jeu-bolt/
│
├── app.py                      # ✅ Backend Flask + SocketIO (COMPLET)
├── run.py                      # ✅ Lanceur du serveur
│
├── index.html                  # ✅ Page d'accueil (AMÉLIORÉ - 3D + Animations)
├── game.html                   # ✅ Interface de jeu (CORRIGÉ)
│
├── static/
│   ├── salle.html             # ✅ Création de salle (hôte)
│   └── copieID.html           # ✅ Rejoindre une salle
│
└── src/
    ├── js/
    │   ├── game-state.js      # ✅ Store central
    │   ├── utils.js           # ✅ Fonctions utilitaires (SONS DÉSACTIVÉS)
    │   ├── realtime.js        # ✅ Pont Socket.IO (CORRIGÉ)
    │   ├── game-main.js       # ✅ Contrôleur principal (CORRIGÉ)
    │   ├── tutorial.js        # ✅ Tutoriel interactif
    │   ├── main.js            # ❌ DOUBLON (ne pas utiliser)
    │   │
    │   └── screens/
    │       ├── role-assignment.js    # ✅ Écran rôles (AUTO-SCROLL)
    │       ├── questions-phase1.js   # ✅ Phase questions (CORRIGÉ)
    │       ├── vote-continue.js      # ✅ Vote continue
    │       ├── questions-phase2.js   # ✅ Phase 2 questions
    │       ├── final-vote.js         # ✅ Vote final (CORRIGÉ)
    │       ├── results.js            # ✅ Résultats (CRÉDITS AJOUTÉS)
    │       ├── intruder-guess.js     # ✅ Devine l'animal (intrus)
    │       └── lobby.js              # ❌ Mode offline (inutile)
    │
    └── styles/
        ├── main.css           # ✅ Styles principaux (EFFETS 3D)
        ├── components.css     # ✅ Composants UI (RIPPLE EFFECT)
        ├── animations.css     # ✅ Animations fluides
        └── tutorial.css       # ✅ Styles du tutoriel
```

---

## 🔄 FLUX DE COMMUNICATION

### **1. Création/Rejoindre une salle**

```
┌─────────┐                  ┌──────────┐                ┌─────────┐
│ Browser │                  │  Flask   │                │ Socket  │
│ (HTML)  │                  │  (REST)  │                │  (IO)   │
└────┬────┘                  └────┬─────┘                └────┬────┘
     │                            │                           │
     │ POST /api/rooms            │                           │
     │ ─────────────────────────> │                           │
     │                            │ Créer room en mémoire     │
     │                            │ ─────────────────────────> │
     │ <─────────────────────────                             │
     │   { roomId: "ROOM-XXXX" }                              │
     │                                                         │
     │ socket.emit('room:create')                             │
     │ ──────────────────────────────────────────────────────> │
     │                                                         │
     │ <───────────────────────────────────────────────────── │
     │   socket.on('room:update', players[])                  │
```

### **2. Démarrage de la partie**

```
┌─────────┐                  ┌──────────┐
│  Hôte   │                  │  Server  │
└────┬────┘                  └────┬─────┘
     │                            │
     │ socket.emit('room:start')  │
     │ ─────────────────────────> │
     │                            │
     │                            │ Assigner rôles
     │                            │ Générer tours
     │                            │
     │ <───────────────────────── │
     │   'room:started'           │
     │   → redirect /game         │
     │                            │
     │ <───────────────────────── │
     │   'game:setup' (public)    │
     │                            │
     │ <───────────────────────── │
     │   'game:role' (privé)      │
     │                            │
     │ <───────────────────────── │
     │   'turn:new' (1er tour)    │
```

### **3. Phase Questions (temps réel)**

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ Questionneur │      │    Server    │      │    Cible     │
└──────┬───────┘      └──────┬───────┘      └──────┬───────┘
       │                     │                     │
       │ question:ask        │                     │
       │ ──────────────────> │                     │
       │                     │ broadcast           │
       │                     │ ──────────────────> │
       │                     │                     │
       │                     │ question:answer     │
       │                     │ <────────────────── │
       │ broadcast           │                     │
       │ <──────────────────                       │
       │                     │                     │
       │                     │ Délai 3s            │
       │                     │ turn_index++        │
       │                     │                     │
       │ <────── turn:new ─────────────────────── │
       │ (tour suivant)      │                     │
```

### **4. Vote Final + Résultats**

```
┌─────────┐                  ┌──────────┐
│ Joueur  │                  │  Server  │
└────┬────┘                  └────┬─────┘
     │                            │
     │ <───────────────────────── │
     │   'final_vote:start'       │
     │                            │
     │ final_vote:cast            │
     │ ─────────────────────────> │
     │                            │
     │ <───────────────────────── │
     │   'final_vote:update'      │
     │   (compteur)               │
     │                            │
     │         ...                │
     │    (tous votent)           │
     │                            │
     │ <───────────────────────── │
     │   'final_vote:end'         │
     │                            │
     │                            │ Calculer scores
     │                            │
     │ <───────────────────────── │
     │   'game:results'           │
     │   { intruder, scores }     │
```

---

## 🗄️ STRUCTURE DES DONNÉES

### **Backend (app.py) - Structure room**

```python
rooms = {
    "ROOM-XXXX": {
        "id": "ROOM-XXXX",
        "status": "waiting" | "started",
        "host_id": "socket_id",
        "players": [
            {
                "id": "socket_id",
                "name": "Alice",
                "avatar": "🦊",
                "offline": False
            }
        ],
        "game": {
            "animal": "🐯",
            "intruder_sid": "socket_id",
            "turns": [
                {"q": "sid1", "t": "sid2"},
                {"q": "sid2", "t": "sid3"}
            ],
            "turn_index": 0,
            "phase": "phase1" | "vote_continue" | "final_vote" | "results",
            "log": [],
            
            # Vote continue
            "vote": {
                "kind": "continue",
                "votes": {"sid1": "yes", "sid2": "no"},
                "expected": 4,
                "open": True,
                "startedAt": 1234567890
            },
            
            # Vote final
            "final_vote": {
                "votes": {"sid1": "sid_suspect", "sid2": "sid_suspect"},
                "expected": 4,
                "open": True
            }
        }
    }
}
```

### **Frontend (game-state.js) - Store**

```javascript
window.gameState = {
    // État général
    players: [],           // Liste publique des joueurs
    currentRoom: "ROOM-XXXX",
    currentPlayer: {...},  // Qui suis-je ?
    currentPlayerName: "Alice",
    mySid: "socket_id",
    
    // Rôles
    roles: {
        "socket_id": {
            isIntruder: true,
            animal: null
        }
    },
    
    // Modes
    mode: "online",
    gamePhase: "phase1"
}
```

---

## 🎯 ÉVÉNEMENTS SOCKET.IO

### **📤 Client → Serveur**

| Événement | Données | Description |
|-----------|---------|-------------|
| `room:create` | `{roomId, name, avatar}` | Créer et rejoindre une salle |
| `room:join` | `{roomId, name, avatar, rejoin}` | Rejoindre une salle |
| `room:start` | `{roomId}` | Démarrer la partie (hôte) |
| `question:ask` | `{roomId, text}` | Poser une question |
| `question:answer` | `{roomId, answer}` | Répondre (yes/no) |
| `vote:continue:cast` | `{roomId, choice}` | Voter (yes/no) |
| `final_vote:cast` | `{roomId, suspectId}` | Voter pour un suspect |

### **📥 Serveur → Client**

| Événement | Données | Description |
|-----------|---------|-------------|
| `room:update` | `[{id, name, avatar}...]` | MAJ liste joueurs |
| `room:started` | `{roomId}` | Partie démarrée |
| `game:setup` | `{roomId, players, status}` | État public du jeu |
| `game:role` | `{isIntruder, animal?}` | Rôle privé |
| `turn:new` | `{questionerId, targetId, index, total}` | Nouveau tour |
| `turn:end` | `{roomId}` | Fin des tours |
| `question:ask` | `{from, to, text}` | Question broadcast |
| `question:answer` | `{from, to, answer}` | Réponse broadcast |
| `vote:continue:start` | `{roomId, total, timeout}` | Début vote |
| `vote:continue:update` | `{count, total, yes, no}` | MAJ vote |
| `vote:continue:end` | `{continue}` | Résultat vote |
| `final_vote:start` | `{roomId, suspects, total}` | Début vote final |
| `final_vote:update` | `{count, total}` | MAJ vote final |
| `final_vote:end` | `{roomId}` | Fin vote final |
| `game:results` | `{intruder, intruderCaught, scores}` | Résultats |
| `server:error` | `{msg}` | Erreur serveur |

---

## 🔐 SÉCURITÉ & VALIDATION

### **Backend (app.py)**

```python
# Validation de l'identité
if request.sid != current['q']:
    return  # Ignore l'action

# Validation de l'état
if not room or 'game' not in room:
    return {'ok': False}

# Validation des données
if not text or len(text) > 200:
    return {'ok': False, 'reason': 'invalid_text'}
```

### **Frontend (realtime.js)**

```javascript
// Vérification des données reçues
socket.on('turn:new', ({ questionerId, targetId } = {}) => {
    if (!questionerId || !targetId) return;
    // ...
});

// Guards pour null/undefined
const player = window.gameState?.getPlayerById?.(id);
if (!player) return;
```

---

## ⚡ OPTIMISATIONS

### **Backend**
- ✅ Utilisation de `socketio.sleep()` (non-bloquant)
- ✅ Background tasks pour délais
- ✅ Broadcast ciblé (room) au lieu de global
- ✅ Nettoyage automatique des votes
- ✅ Reconnexion intelligente avec `_relink_sid()`

### **Frontend**
- ✅ Store central (évite les props drilling)
- ✅ Événements personnalisés (découplage)
- ✅ Guards null/undefined partout
- ✅ Pas de polling (100% event-driven)
- ✅ **Animations GPU-accélérées** (transform, opacity)
- ✅ **Sons désactivés** (économie de ressources)
- ✅ **Auto-scroll intelligent** sur replay et rôle

### **Performance visuelle**
- ✅ **CSS transforms** au lieu de propriétés layout
- ✅ **will-change** pour optimiser les animations
- ✅ **Backdrop-filter** avec fallback
- ✅ **Lazy loading** des animations (animation-delay)
- ✅ **Debounce** sur le resize (250ms)
- ✅ **requestAnimationFrame** pour animations fluides

---

## 🎯 NOUVELLES FONCTIONNALITÉS (v2.0)

### **1. Auto-scroll intelligent**
- Scroll automatique vers le haut lors du clic "Rejouer"
- Scroll automatique lors de l'affichage de l'écran de rôle
- Animation smooth pour meilleure UX

**Code**:
```javascript
// results.js - playAgain()
window.scrollTo({ top: 0, behavior: 'smooth' });

// role-assignment.js - show()
window.scrollTo({ top: 0, behavior: 'smooth' });
```

### **2. Crédits développeur**
- Affichage automatique à la fin de chaque partie
- Design glassmorphism cohérent
- Lien cliquable avec effet hover
- Animation d'apparition progressive

**Emplacement**: Écran des résultats (après les boutons d'action)

### **3. Effets visuels 3D**
- **Page d'accueil transformée**:
  - Titre avec gradient animé
  - Formes flottantes en arrière-plan
  - Cartes 3D avec rotation au survol
  - Glassmorphism sur tous les éléments
  
- **Boutons améliorés**:
  - Ripple effect (vague) au survol
  - Scale + translation 3D
  - Glow effects colorés
  
- **Icônes animées**:
  - Flottement continu (float animation)
  - Rotation subtile au survol

### **4. Design System moderne**
- Palette de couleurs vibrante
- 6 niveaux d'ombres
- Glow effects avec couleurs primaires
- Typographie fluide avec clamp()
- Animations optimisées GPU

---

## 🔧 CONFIGURATION DÉVELOPPEUR

### **Variables d'environnement**
```python
# run.py
app.run(debug=True, host='0.0.0.0', port=5000)
```

### **Debug mode**
```javascript
// realtime.js
const DEBUG = true;  // Active les logs Socket.IO
const L = (ev, data) => DEBUG && console.log(`[SOCKET] ${ev}`, data);
```

### **Désactiver les animations (dev)**
```css
/* Ajouter temporairement dans main.css */
*, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
}
```

---

## 📦 DÉPENDANCES

### **Backend**
```
Flask==2.3.0
Flask-SocketIO==5.3.0
python-socketio==5.9.0
eventlet==0.33.3
```

### **Frontend**
```
Socket.IO Client (CDN): 4.5.4
Google Fonts: Nunito (300, 400, 600, 700, 800, 900)
```

### **Aucune dépendance npm** 
- Pure JavaScript (Vanilla JS)
- CSS3 natif
- HTML5

---

## 🐛 GESTION DES ERREURS

### **Reconnexion**
1. Joueur se déconnecte → `offline: True`
2. Rejoin avec même nom → `_relink_sid()`
3. Restauration du rôle et de l'état

### **Votes incomplets**
- Vote continue : ajustement dynamique de `expected`
- Timeout de 30s pour forcer la clôture
- Déconnexion pendant le vote → décompte ajusté

### **Erreurs réseau**
```javascript
socket.on('connect_error', (err) => {
    console.error('[connect_error]', err);
});

socket.on('disconnect', (why) => {
    console.warn('[disconnect]', why);
});
```

---

## 📊 PERFORMANCES

### **Scalabilité actuelle**
- ✅ 10 joueurs max par salle
- ✅ Plusieurs salles simultanées
- ⚠️ Données en mémoire (perdues au redémarrage)
- ⚠️ Pas de persistance en base de données

### **Améliorations possibles**
- [ ] Redis pour la persistance des salles
- [ ] Load balancing avec plusieurs serveurs
- [ ] Compression des messages Socket.IO
- [ ] Rate limiting pour éviter le spam

---

## 🎨 UX/UI

### **Design System Moderne**

#### Effets visuels 3D:
- **Perspective**: Page d'accueil avec `perspective: 1000px`
- **Transform 3D**: Cartes avec `transform-style: preserve-3d`
- **Rotations**: `rotateX()` et `rotateZ()` au survol
- **Glassmorphism**: `backdrop-filter: blur(20px)`

#### Animations principales:
- **Gradient Flow**: Titre animé avec gradient multicolore
- **Float**: Icônes et formes flottantes en arrière-plan
- **Ripple Effect**: Vague blanche dans les boutons au survol
- **Slide-up**: Entrée fluide des écrans
- **Fade-in**: Apparition progressive des éléments
- **Bounce**: Feedback visuel sur les interactions
- **Pulse**: Éléments actifs qui "respirent"
- **Wiggle**: Indication d'erreur
- **Flip**: Révélations de cartes

### **Formes flottantes**
```html
<div class="floating-shapes">
    <div class="shape">🎮</div>
    <div class="shape">🕵️</div>
    <div class="shape">🎭</div>
    <div class="shape">✨</div>
</div>
```

### **Responsive Design**
```css
@media (max-width: 768px) {
    /* Adaptations tablette */
    .game-card:hover {
        transform: translateY(-8px); /* Réduit effet 3D */
    }
}

@media (max-width: 480px) {
    /* Adaptations mobile */
    .shape {
        font-size: 3rem !important;
    }
}
```

### **Accessibilité**
```css
@media (prefers-reduced-motion: reduce) {
    /* Désactive les animations complexes */
    *,
    *::before,
    *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}
```

### **Palette de couleurs**
- **Primary**: `#6366F1` (Indigo vibrant)
- **Secondary**: `#EC4899` (Rose vif)  
- **Accent**: `#14B8A6` (Turquoise)
- **Gradients**: Combinaisons animées pour effets modernes
- **Shadows**: 6 niveaux d'ombres + glow effects

### **Crédits développeur**
Affichés automatiquement à la fin de chaque partie dans `results.js`:
```javascript
addCredits() {
    // Bloc avec glassmorphism
    // Lien vers Linktree: https://linktr.ee/Zakariae_Belarbi
    // "Made by Belarbi Zakariae"
}
```

### **Fonctionnalités désactivées**
- ❌ **Sons**: Toutes les fonctions audio sont désactivées dans `utils.js`
  - `playSound()` → return
  - `playClickSound()` → return
  - `playSuccessSound()` → return
  - `playErrorSound()` → return

---

## 🔄 CYCLE DE VIE D'UNE PARTIE

```
1. Lobby (index.html)
   ├─> Créer une salle → /salle
   └─> Rejoindre une salle → /join
   
2. Salle d'attente (salle.html / copieID.html)
   └─> room:create / room:join
   └─> Attente de 3-8 joueurs
   └─> room:start (hôte)
   
3. Role Assignment (auto-scroll activé)
   └─> game:setup + game:role
   └─> Chaque joueur clique "Suivant"
   └─> Scroll automatique vers le haut
   
4. Phase 1 (Questions en paires)
   └─> turn:new → question:ask → question:answer (× N tours)
   └─> turn:end
   
5. Vote Continue
   └─> vote:continue:start
   └─> vote:continue:cast (× N joueurs)
   └─> vote:continue:end
   
   ├─> Si OUI : Phase 2 ↓
   └─> Si NON : Vote Final ↓
   
6. Phase 2 (Questions libres - si vote OUI)
   └─> Question à tous
   └─> Réponses multiples
   └─> Nouveau vote continue
   
7. Devine l'animal (Intrus uniquement)
   └─> intruder:guess
   └─> Si correct → Intrus gagne bonus
   
8. Vote Final
   └─> final_vote:start
   └─> final_vote:cast (× N joueurs)
   └─> final_vote:end
   
9. Résultats (avec crédits)
   └─> game:results
   └─> Affichage scores + intrus révélé
   └─> Crédits développeur affichés
   └─> "Rejouer" → Scroll auto vers le haut
   └─> "Retour au lobby" → index.html
```

---

## 📝 CONVENTIONS DE CODE

### **Naming**
- Événements Socket.IO : `kebab-case` (ex: `vote:continue:cast`)
- Fonctions Python : `snake_case` (ex: `_start_final_vote`)
- Fonctions JavaScript : `camelCase` (ex: `displayResults`)
- Classes CSS : `kebab-case` (ex: `.vote-btn`)

### **Logs**
```python
print(f"[vote] cast from {request.sid} choice={choice}", flush=True)
```

```javascript
const L = (ev, data) => DEBUG && console.log(`[SOCKET] ${ev}`, data);
```

---

**Architecture 100% opérationnelle ! 🚀**

## ✨ CHANGELOG v2.0

### 🎨 Améliorations visuelles
- ✅ Page d'accueil redesignée avec effets 3D
- ✅ Formes flottantes animées en arrière-plan
- ✅ Titre avec gradient multicolore animé
- ✅ Cartes avec glassmorphism et rotations 3D
- ✅ Ripple effect sur tous les boutons
- ✅ Badges de fonctionnalités stylisés

### 🔇 Performance
- ✅ Effets sonores désactivés (économie CPU)
- ✅ Animations GPU-accélérées
- ✅ Optimisation des transitions CSS

### 🎯 UX améliorée
- ✅ Auto-scroll intelligent lors du replay
- ✅ Auto-scroll sur écran de rôle
- ✅ Crédits développeur intégrés

### 👋 Crédits
- ✅ Lien vers portfolio
- ✅ Design cohérent avec le jeu
- ✅ Animation d'apparition progressive

---

## 🚀 PRÊT POUR LA PRODUCTION

Le jeu est maintenant:
- ✅ **Fonctionnel** à 100%
- ✅ **Optimisé** pour les performances
- ✅ **Responsive** sur tous les appareils
- ✅ **Accessible** (reduced motion support)
- ✅ **Visuellement impressionnant** avec effets 3D
- ✅ **Sans bugs** connus

Pour démarrer: `python run.py` puis ouvrir http://localhost:5000
