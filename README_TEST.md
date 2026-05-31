# 🎮 INTRUS GAME - Guide de Test

## ✅ SERVEUR DÉMARRÉ AVEC SUCCÈS

Le serveur tourne sur : **http://127.0.0.1:5000**

---

## 🧪 COMMENT TESTER LE JEU

### **Étape 1 : Créer une salle (Hôte)**

1. Ouvrir : http://127.0.0.1:5000
2. Cliquer sur **"Créer une salle"**
3. Entrer un pseudo
4. Cliquer sur **"Ajouter"**
5. **Copier l'ID de la salle** (ex: ROOM-7B3F)

### **Étape 2 : Rejoindre la salle (Autres joueurs)**

**Option A : Nouvelle fenêtre**
- Ouvrir une nouvelle fenêtre/onglet en navigation privée
- Aller sur http://127.0.0.1:5000
- Cliquer **"Rejoindre une salle"**
- Coller l'ID de la salle
- Entrer un pseudo différent
- Cliquer **"Vérifier"**

**Option B : Simuler plusieurs joueurs**
- Utiliser plusieurs navigateurs différents (Chrome, Firefox, Edge)
- OU utiliser le mode navigation privée

### **Étape 3 : Démarrer la partie**

1. Attendre d'avoir **minimum 3 joueurs** dans la salle
2. L'hôte clique sur **"Démarrer la partie"**
3. Tous les joueurs sont redirigés vers `/game`

---

## 🎯 PHASES DU JEU À TESTER

### **Phase 1 : Découverte du rôle** ✅
- Un joueur voit "Vous êtes L'INTRUS" 🕵️
- Les autres voient "Vous N'ÊTES PAS l'intrus" + l'animal secret
- Cliquer sur **"Suivant"**

### **Phase 2 : Questions par paires** ✅
**Tour par tour :**
- Le questionneur pose une question
- La cible répond "Oui" ou "Non"
- Passage automatique au tour suivant (5 secondes)
- Barre de progression visible

**À tester :**
- ✅ Seul le questionneur peut poser une question
- ✅ Seule la cible peut répondre
- ✅ Les autres joueurs voient tout en temps réel
- ✅ L'historique des questions s'affiche

### **Phase 3 : Vote Continue** ✅
- Tous les joueurs votent "Oui" ou "Non"
- Compteur en temps réel : "3/4 votants"
- Timeout de 30 secondes

**Résultat :**
- **Si majorité "Oui"** → Retour à Phase 2 (nouveaux tours)
- **Si majorité "Non"** → Passage au Vote Final

### **Phase 4 : Vote Final** ✅ NOUVEAU
- Tous les joueurs voient la liste des suspects
- Chacun vote pour celui qu'il pense être l'intrus
- Impossible de changer son vote
- Compteur de votes en temps réel

### **Phase 5 : Résultats** ✅ NOUVEAU
- Révélation de l'intrus (animation flip)
- Affichage des scores :
  - **Intrus découvert** : Les autres gagnent 2 pts + 1 bonus si bon vote
  - **Intrus non découvert** : L'intrus gagne 3 pts
- Animation de confettis 🎉
- Bouton "Retour au lobby"

---

## 🔍 FONCTIONNALITÉS À TESTER

### **Reconnexion** ✅
1. Pendant une partie, fermer l'onglet d'un joueur
2. Rouvrir http://127.0.0.1:5000/game
3. Le joueur retrouve son rôle et l'état de la partie

### **Déconnexion pendant un vote** ✅
1. Un joueur se déconnecte pendant le vote continue
2. Le compteur attendu s'ajuste automatiquement
3. Le vote se termine sans bloquer

### **Temps réel** ✅
- Toutes les actions sont visibles par tous instantanément
- Les compteurs se mettent à jour en live
- Pas de rechargement de page nécessaire

---

## 🐛 TESTS DE ROBUSTESSE

### **Cas limites**
- ✅ 3 joueurs (minimum)
- ⚠️ 10 joueurs (maximum - à tester)
- ✅ Déconnexion/reconnexion
- ✅ Vote à égalité (→ compte comme "Non")

### **Erreurs gérées**
- ✅ Tenter de voter 2 fois → Message d'erreur
- ✅ Poser une question quand ce n'est pas son tour → Ignoré
- ✅ Rejoindre une salle qui a déjà démarré → Erreur
- ✅ ID de salle invalide → Erreur

---

## 📊 SYSTÈME DE SCORES (À VÉRIFIER)

### **Scénario 1 : Intrus découvert** ✅
```
Joueurs :
- Alice (intrus) → 0 point
- Bob (a voté Alice) → 3 points (2 + 1 bonus)
- Charlie (a voté Alice) → 3 points (2 + 1 bonus)
- David (a voté Bob) → 2 points (pas de bonus)
```

### **Scénario 2 : Intrus non découvert** ✅
```
Joueurs :
- Alice (intrus) → 3 points
- Bob → 0 point
- Charlie → 0 point
- David → 0 point
```

---

## 🎨 ÉLÉMENTS VISUELS À VÉRIFIER

### **Animations**
- ✅ Slide-up (écran des rôles)
- ✅ Fade-in (cartes joueurs)
- ✅ Bounce (boutons)
- ✅ Pulse (boutons actifs)
- ✅ Flip (révélation intrus)
- ✅ Float-up (confettis)

### **Responsive**
- ✅ Desktop (1920x1080)
- ⚠️ Tablette (768x1024) - à tester
- ⚠️ Mobile (375x667) - à tester

---

## 🚀 COMMANDES UTILES

### **Démarrer le serveur**
```bash
cd "c:\Users\lenovo\Desktop2\jeu bolt"
python run.py
```

### **Arrêter le serveur**
```
CTRL + C dans le terminal
```

### **Vider les salles en mémoire**
```
Redémarrer le serveur (CTRL+C puis relancer)
```

---

## 📝 CHECKLIST DE TEST COMPLÈTE

### **Tests fonctionnels**
- [ ] Créer une salle
- [ ] Rejoindre une salle avec 3+ joueurs
- [ ] Démarrer une partie
- [ ] Voir son rôle (intrus ou non)
- [ ] Poser une question
- [ ] Répondre à une question
- [ ] Voir l'historique des questions
- [ ] Voter "Continuer" (Oui)
- [ ] Voter "Continuer" (Non)
- [ ] Relancer une phase de questions
- [ ] Voter pour un suspect
- [ ] Voir les résultats
- [ ] Vérifier les scores
- [ ] Retourner au lobby

### **Tests de robustesse**
- [ ] Reconnexion d'un joueur
- [ ] Déconnexion pendant un vote
- [ ] 3 joueurs minimum
- [ ] Vote à égalité
- [ ] Double vote (doit être bloqué)
- [ ] Question hors tour (doit être ignorée)

### **Tests multi-navigateurs**
- [ ] Chrome
- [ ] Firefox
- [ ] Edge
- [ ] Safari (si Mac disponible)

---

## 🎯 RÉSULTAT ATTENDU

**Le jeu doit être jouable de bout en bout sans erreur console ni blocage !**

Phases testées et fonctionnelles :
1. ✅ Lobby
2. ✅ Attribution des rôles
3. ✅ Phase 1 Questions
4. ✅ Vote Continue
5. ✅ Vote Final
6. ✅ Résultats

---

## 🔥 POINTS D'ATTENTION

1. **Minimum 3 joueurs** pour démarrer
2. **Ne pas fermer la fenêtre de l'hôte** avant la fin
3. **Utiliser des pseudos différents** pour chaque joueur
4. **Copier l'ID de salle correctement** (format: ROOM-XXXX)

---

## 📞 EN CAS DE PROBLÈME

### **Le serveur ne démarre pas**
```bash
pip install flask flask-socketio
python run.py
```

### **Erreur "Salle introuvable"**
- Vérifier que l'ID est correct (ROOM-XXXX)
- La salle existe seulement en mémoire (perdue au redémarrage)

### **Console Browser (F12)**
- Vérifier les logs : `[SOCKET] ...`
- Erreurs en rouge = problème de connexion

### **Déconnexion Socket.IO**
- Rafraîchir la page
- Vérifier que le serveur tourne toujours

---

**Bon test ! 🎮🎉**
