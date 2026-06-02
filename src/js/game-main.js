// src/js/game-main.js
class IntrusGameApp {
  constructor() {
    this.currentScreen = 'role-screen'; // par défaut sur la page game.html
    this.init();
  }

  init() {
    this.setupGlobalEventListeners();
    this.initializeScreens();
    // pas de "welcome animation" ici
  }

  setupGlobalEventListeners() {
    // Quelques raccourcis utiles (sans retour lobby)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F1') {
        e.preventDefault();
        this.showHelp();
      }
    });

    // (optionnel) blocage clic droit pour "feeling prod"
    document.addEventListener('contextmenu', (e) => e.preventDefault());

    // Responsive
    window.addEventListener('resize', Utils.debounce(() => this.handleResize(), 250));
  }

  initializeScreens() {
    // ⚠️ PAS DE LobbyScreen ici
    if (window.RoleAssignmentScreen?.init) RoleAssignmentScreen.init();
    if (window.QuestionsPhase1Screen?.init) QuestionsPhase1Screen.init();
    if (window.VoteContinueScreen?.init) VoteContinueScreen.init();
    if (window.QuestionsPhase2Screen?.init) QuestionsPhase2Screen.init();
    if (window.FinalVoteScreen?.init) FinalVoteScreen.init();
    if (window.ResultsScreen?.init) ResultsScreen.init();
  }

  showHelp() {
    const help = Utils.createElement('div', 'modal-overlay');
    help.style.cssText = `
      position:fixed;inset:0;background:rgba(0,0,0,.5);
      display:flex;align-items:center;justify-content:center;z-index:10000;
    `;
    help.innerHTML = `
      <div class="help-modal" style="background:#fff;padding:2rem;border-radius:16px;max-width:520px">
        <h3>${Utils.escapeHTML(t('help.title'))}</h3>
        <p>${Utils.escapeHTML(t('help.rule1'))}</p>
        <p>${Utils.escapeHTML(t('help.rule2'))}</p>
        <p>${Utils.escapeHTML(t('help.rule3'))}</p>
        <div style="text-align:right;margin-top:1rem">
          <button class="primary-btn" onclick="this.closest('.modal-overlay').remove()">${Utils.escapeHTML(t('help.close'))}</button>
        </div>
      </div>
    `;
    document.body.appendChild(help);
  }

  handleResize() {
    const vw = window.innerWidth, vh = window.innerHeight;
    document.body.classList.toggle('mobile-small', vw < 480);
    document.body.classList.toggle('landscape-mobile', (vw > vh && vh < 500));
  }

  navigateTo(screenId, data = null) {
    this.currentScreen = screenId;
    
    // Cacher tous les écrans
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    
    // Afficher le bon écran
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
      targetScreen.classList.add('active');
    }
    
    // Initialiser l'écran
    switch (screenId) {
      case 'role-screen':
        if (window.RoleAssignmentScreen?.show) RoleAssignmentScreen.show();
        break;
      case 'questions-phase1-screen':
        if (window.QuestionsPhase1Screen?.show) QuestionsPhase1Screen.show();
        break;
      case 'vote-continue-screen':
        if (window.VoteContinueScreen?.show) VoteContinueScreen.show();
        break;
      case 'questions-phase2-screen':
        if (window.QuestionsPhase2Screen?.show) QuestionsPhase2Screen.show();
        break;
      case 'final-vote-screen':
        if (window.FinalVoteScreen?.show) FinalVoteScreen.show();
        break;
      case 'results-screen':
        if (window.ResultsScreen?.show) ResultsScreen.show();
        break;
      default:
        console.warn('[navigateTo] écran inconnu:', screenId);
    }
  }

  getGameInfo() {
    return {
      currentScreen: this.currentScreen,
      gamePhase: gameState.gamePhase,
      playerCount: gameState.players.length,
      roomId: gameState.currentRoom
    };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.intrusGame = new IntrusGameApp();
  console.log('🎮 game-main.js initialisé');
});
