// src/js/screens/vote-continue.js
const VoteContinueScreen = {
  hasVoted: false,
  totalPlayers: 0,
  ready: false,     // ← actif seulement après vote:continue:start
  _bound: false,

  init() {
    if (this._bound) return;
    this._bound = true;
    this.bindEvents();
  },

  bindEvents() {
    const yesBtn = Utils.getElementById('vote-yes-btn');
    const noBtn  = Utils.getElementById('vote-no-btn');
    yesBtn?.addEventListener('click', () => this.submitVote('yes'));
    noBtn?.addEventListener('click',  () => this.submitVote('no'));
  },

  // Appelé par vote:continue:start (serveur)
  begin({ total } = {}) {
    console.log('[VoteContinueScreen] begin() called with total:', total);
    this.totalPlayers = Number(total) || (window.gameState?.players?.length || 0);
    this.hasVoted = false;
    this.ready = true;

    this.enableVoteButtons();
    this.updateVoteCounter(0, this.totalPlayers);
    console.log('[VoteContinueScreen] Counter updated to 0/' + this.totalPlayers);

    const box = document.querySelector('.vote-container');
    if (box) {
      box.style.opacity = '0'; box.style.transform = 'scale(0.96)';
      setTimeout(() => {
        box.style.transition = 'all .35s ease';
        box.style.opacity = '1'; box.style.transform = 'scale(1)';
      }, 50);
    }
    Utils.pulse?.(Utils.getElementById('vote-yes-btn'));
    Utils.pulse?.(Utils.getElementById('vote-no-btn'));
  },

  // Compat: si quelqu'un appelle show() manuellement
  show() {
    console.log('[VoteContinueScreen] show() called, current ready:', this.ready);
    Utils.showScreen('vote-continue-screen');
    // NE PAS désactiver si le vote a déjà commencé !
    if (!this.ready) {
      console.log('[VoteContinueScreen] show() - vote not ready, disabling buttons');
      this.disableVoteButtons();
      this.updateVoteCounter(0, window.gameState?.players?.length || 0);
    } else {
      console.log('[VoteContinueScreen] show() - vote already ready, keeping buttons enabled');
    }
  },

  // Mise à jour live (serveur)
  update({ count, total, yes, no } = {}) {
    if (typeof total === 'number') this.totalPlayers = total;
    this.updateVoteCounter(count ?? 0, this.totalPlayers);

    const yc = Utils.getElementById('vc-yes-count'); if (yc && typeof yes === 'number') yc.textContent = String(yes);
    const nc = Utils.getElementById('vc-no-count');  if (nc && typeof no  === 'number') nc.textContent  = String(no);
  },

  submitVote(vote) {
    console.log('[VoteContinueScreen] submitVote - ready:', this.ready, 'hasVoted:', this.hasVoted, 'vote:', vote);
    if (!this.ready) {
      console.warn('[VoteContinueScreen] Vote rejected: not ready');
      Utils.showNotification("Le vote n'est pas encore ouvert…", 'warning');
      return;
    }
    if (this.hasVoted) {
      Utils.showNotification('Vous avez déjà voté !', 'error');
      Utils.playErrorSound?.();
      return;
    }

    const me = window.gameState?.currentPlayer;
// On peut continuer sans me (le serveur n’en a pas besoin)
    if (!me) console.warn('[vote] currentPlayer absent — on continue quand même');


    // En temps réel : on envoie au serveur
    window.realtime?.voteContinue?.(vote);

    this.hasVoted = true;
    this.highlightVote(vote);
    this.disableVoteButtons();
    Utils.showNotification(`Votre vote : ${vote === 'yes' ? 'Oui' : 'Non'}`, 'success');
    Utils.playSuccessSound?.();
  },

  // Helpers UI
  highlightVote(vote) {
    const yesBtn = Utils.getElementById('vote-yes-btn');
    const noBtn  = Utils.getElementById('vote-no-btn');
    if (vote === 'yes' && yesBtn) {
      yesBtn.style.transform = 'scale(1.08)';
      yesBtn.style.border = '3px solid var(--success)';
      yesBtn.style.background = 'var(--green-pastel)';
      Utils.bounce?.(yesBtn);
    } else if (vote === 'no' && noBtn) {
      noBtn.style.transform = 'scale(1.08)';
      noBtn.style.border = '3px solid var(--error)';
      noBtn.style.background = 'var(--red-pastel)';
      Utils.bounce?.(noBtn);
    }
  },

  disableVoteButtons() {
    const y = Utils.getElementById('vote-yes-btn');
    const n = Utils.getElementById('vote-no-btn');
    if (y) { y.disabled = true; y.style.cursor = 'not-allowed'; }
    if (n) { n.disabled = true; n.style.cursor = 'not-allowed'; }
    Utils.stopPulse?.(y); Utils.stopPulse?.(n);
  },

  enableVoteButtons() {
    const y = Utils.getElementById('vote-yes-btn');
    const n = Utils.getElementById('vote-no-btn');
    if (y) { y.disabled = false; y.style.cursor = 'pointer'; y.style.transform = ''; y.style.border = ''; y.style.background = ''; }
    if (n) { n.disabled = false; n.style.cursor = 'pointer'; n.style.transform = ''; n.style.border = ''; n.style.background = ''; }
  },

  updateVoteCounter(count = 0, total = 0) {
    const counter = Utils.getElementById('vote-count');
    if (!counter) return;
    counter.textContent = `${count}/${total}`;
    Utils.bounce?.(counter);

    const pct = total ? count / total : 0;
    if (pct >= 1) {
      counter.style.color = 'var(--success)';
      counter.parentElement && (counter.parentElement.style.background = 'var(--green-pastel)');
    } else if (pct >= 0.5) {
      counter.style.color = 'var(--warning)';
    } else {
      counter.style.color = '';
      counter.parentElement && (counter.parentElement.style.background = '');
    }
  }
};

// Exposer globalement pour que realtime.js puisse l'utiliser
window.VoteContinueScreen = VoteContinueScreen;

document.addEventListener('DOMContentLoaded', () => VoteContinueScreen.init());
