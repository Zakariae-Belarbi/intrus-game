// src/js/screens/role-assignment.js

const RoleAssignmentScreen = {
  _bound: false,

  init() {
    if (this._bound) return;
    this._bound = true;

    // Bouton "Suivant"
    const btn = Utils.getElementById('role-next-btn');
    if (btn) {
      btn.addEventListener('click', () => this.proceedToQuestions());
      btn.style.display = 'none'; // caché tant que le rôle n'est pas connu
    }

    // Écoute l'arrivée des données qui débloquent l'écran
    document.addEventListener('state:players', () => this.displayRole());
    document.addEventListener('state:role',    () => this.displayRole());
    
    // Écouter l'événement phase:start pour savoir quand tous les joueurs sont prêts
    document.addEventListener('phase:start', () => {
      console.log('[RoleAssignment] Received phase:start event');
      // La navigation sera gérée automatiquement par realtime.js après un délai
    });

    // Premier rendu
    this.displayRole();
  },

  show() {
    Utils.showScreen('role-screen');
    this.displayRole();
    // Remonter en haut de la page pour voir le rôle
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  displayRole() {
    const nextButton  = Utils.getElementById('role-next-btn');
    const roleIcon    = Utils.getElementById('role-icon');
    const roleTitle   = Utils.getElementById('role-title');
    const roleContent = Utils.getElementById('role-content');

    // Qui suis-je ? (déterminé par realtime: setPlayers + setCurrentPlayerByName)
    const me         = gameState.currentPlayer;
    const currentRole = gameState.getMyRole(); // ✅ via store

    // État d’attente si l’un manque
    if (!me || !currentRole) {
      if (roleIcon)  roleIcon.textContent  = '⏳';
      if (roleTitle) roleTitle.textContent = 'Préparation en cours...';
      if (roleContent) roleContent.innerHTML = '<p>Attribution des rôles…</p>';
      if (nextButton)  nextButton.style.display = 'none';
      return; // plus de polling: on attend les events state:players/state:role
    }

    // Petite anim d'entrée
    const roleCard = document.querySelector('.role-card');
    roleCard?.classList.add('slide-up');

    // Remplir selon le rôle
    if (currentRole.isIntruder) {
      this.displayIntruderRole();
    } else {
      this.displayNormalRole(currentRole.animal);
    }

    // Afficher le bouton ensuite et le réinitialiser
    if (nextButton) {
      nextButton.textContent = 'Suivant';
      nextButton.disabled = false;
      nextButton.classList.remove('loading');
      nextButton.style.display = 'block';
      Utils.popIn(nextButton);
      Utils.playSuccessSound();
    }
  },

  displayIntruderRole() {
    const roleIcon    = Utils.getElementById('role-icon');
    const roleTitle   = Utils.getElementById('role-title');
    const roleContent = Utils.getElementById('role-content');

    setTimeout(() => { roleIcon.textContent = '🕵️'; Utils.wiggle(roleIcon); }, 200);

    setTimeout(() => {
      roleTitle.textContent = "Vous êtes L'INTRUS !";
      roleTitle.className   = 'intruder-role';
      Utils.fadeIn(roleTitle);
    }, 400);

    setTimeout(() => {
      roleContent.innerHTML = `
        <p>🎯 <strong>Votre mission :</strong></p>
        <p>Devinez l'animal secret sans vous faire découvrir !</p>
        <p>Posez des questions subtiles pour découvrir l'animal secret.</p>
        <p>Évitez d'être suspecté par les autres joueurs.</p>
        <div class="animal-reveal" style="background: var(--red-pastel); color: var(--error);">
          Animal secret : <strong>À DÉCOUVRIR</strong> 🤔
        </div>
      `;
      Utils.slideUp(roleContent);
    }, 600);

    setTimeout(() => {
      Utils.playSound(300, 200);
      setTimeout(() => Utils.playSound(250, 200), 200);
    }, 800);
  },

  displayNormalRole(animal) {
    const roleIcon    = Utils.getElementById('role-icon');
    const roleTitle   = Utils.getElementById('role-title');
    const roleContent = Utils.getElementById('role-content');
    
    // Formater l'animal : nom + emoji si c'est un objet, sinon juste l'animal
    let animalDisplay = '—';
    if (animal) {
      if (typeof animal === 'object' && animal.name && animal.emoji) {
        animalDisplay = `${animal.name} ${animal.emoji}`;
      } else {
        animalDisplay = String(animal);
      }
    }

    setTimeout(() => { roleIcon.textContent = '👥'; Utils.bounce(roleIcon); }, 200);

    setTimeout(() => {
      roleTitle.textContent = "Vous N'ÊTES PAS l'intrus !";
      roleTitle.className   = 'normal-role';
      Utils.fadeIn(roleTitle);
    }, 400);

    setTimeout(() => {
      roleContent.innerHTML = `
        <p>🎯 <strong>Votre mission :</strong></p>
        <p>Découvrez qui est l'intrus parmi vous !</p>
        <p>Utilisez l'animal secret pour poser des questions piège.</p>
        <p>Observez les réactions et réponses des autres.</p>
        <div class="animal-reveal">
          L'animal secret est : <strong>${animalDisplay}</strong>
        </div>
      `;
      Utils.slideUp(roleContent);
    }, 600);

    setTimeout(() => { Utils.playSuccessSound(); }, 800);
  },

  proceedToQuestions() {
    Utils.playClickSound();

    const btn = Utils.getElementById('role-next-btn');
    const roleContent = Utils.getElementById('role-content');
    
    if (btn) { 
      btn.textContent = 'En attente des autres joueurs...'; 
      btn.disabled = true;
      btn.style.opacity = '0.6';
    }

    // Afficher un message d'attente sur l'écran de rôle
    if (roleContent) {
      const waitingDiv = document.createElement('div');
      waitingDiv.id = 'waiting-for-others';
      waitingDiv.style.cssText = 'margin-top: 2rem; padding: 1.5rem; background: var(--orange-soft); border-radius: 12px; text-align: center;';
      waitingDiv.innerHTML = `
        <p style="font-size: 1.1rem; color: var(--text-primary); margin: 0;">
          ⏳ En attente des autres joueurs...
        </p>
        <p id="ready-counter" style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 0.5rem;">
          Préparation en cours...
        </p>
      `;
      roleContent.appendChild(waitingDiv);
    }

    // Signaler au serveur que ce joueur est prêt
    const roomId = window.gameState?.roomId;
    if (roomId && window.socket) {
      window.socket.emit('player:ready', { roomId });
    }

    // NE PAS naviguer vers l'écran de questions ici
    // On attend l'événement phase:start du serveur
  }
};

// Exposer globalement
window.RoleAssignmentScreen = RoleAssignmentScreen;

// auto-init
document.addEventListener('DOMContentLoaded', () => RoleAssignmentScreen.init());
