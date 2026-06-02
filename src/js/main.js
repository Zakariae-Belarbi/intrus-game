// Main Application Controller
class IntrusGameApp {
    constructor() {
        this.currentScreen = 'lobby-screen';
        this.init();
    }

    init() {
  this.setupGlobalEventListeners();
  this.initializeScreens();

  // sur game.html, pas de lobby => évite de lancer des anims du lobby
  if (document.getElementById('lobby-screen')) {
    this.showWelcomeAnimation();
  }
}

    setupGlobalEventListeners() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // ESC key to go back to lobby (debug mode)
            if (e.key === 'Escape' && e.ctrlKey) {
                this.debugReturnToLobby();
            }
            
            // F1 key for help (future feature)
            if (e.key === 'F1') {
                e.preventDefault();
                this.showHelp();
            }
        });

        // Prevent context menu for production feel
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handlePageHidden();
            } else {
                this.handlePageVisible();
            }
        });

        // Handle before unload
        window.addEventListener('beforeunload', (e) => {
            if (gameState.gamePhase !== 'lobby' && gameState.players.length > 0) {
                e.preventDefault();
                e.returnValue = 'Êtes-vous sûr de vouloir quitter la partie ?';
            }
        });

        // Handle resize for responsive behavior
        window.addEventListener('resize', Utils.debounce(() => {
            this.handleResize();
        }, 250));
    }

    initializeScreens() {
  // si lobby absent sur game.html, on ignore
  if (window.LobbyScreen?.init) LobbyScreen.init();

  if (window.RoleAssignmentScreen?.init) RoleAssignmentScreen.init();
  if (window.QuestionsPhase1Screen?.init) QuestionsPhase1Screen.init?.();
  if (window.VoteContinueScreen?.init)   VoteContinueScreen.init?.();
  if (window.QuestionsPhase2Screen?.init)   QuestionsPhase2Screen.init?.();
  if (window.FinalVoteScreen?.init)      FinalVoteScreen.init?.();
  if (window.ResultsScreen?.init)        ResultsScreen.init?.();
}

    showWelcomeAnimation() {
        // Add welcome animation to the main title
        const title = document.querySelector('.main-title');
        if (title) {
            title.style.opacity = '0';
            title.style.transform = 'translateY(-30px)';
            
            setTimeout(() => {
                title.style.transition = 'all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                title.style.opacity = '1';
                title.style.transform = 'translateY(0)';
            }, 300);
        }

        // Add staggered animations to cards
        const cards = document.querySelectorAll('.game-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.6s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 500 + (index * 200));
        });

        // Play welcome sound
        setTimeout(() => {
            Utils.playSound(800, 200);
            setTimeout(() => Utils.playSound(1000, 200), 100);
        }, 800);
    }

    debugReturnToLobby() {
        if (confirm('Retourner au lobby ? (Mode debug)')) {
            gameState.reset();
            Utils.showScreen('lobby-screen');
            LobbyScreen.show();
            Utils.showNotification('Retour au lobby (debug)', 'info');
        }
    }

    showHelp() {
        const helpContent = `
            <div class="help-modal">
                <h3>🎮 Comment jouer à Intrus Game</h3>
                <div class="help-content">
                    <h4>📝 Règles du jeu :</h4>
                    <ul>
                        <li>Un joueur est secrètement désigné comme l'intrus</li>
                        <li>Les autres joueurs connaissent l'animal secret</li>
                        <li>L'intrus doit deviner l'animal secret</li>
                        <li>Les joueurs normaux doivent découvrir l'intrus</li>
                    </ul>
                    
                    <h4>Déroulement :</h4>
                    <ol>
                        <li>Phase de questions en paires</li>
                        <li>Vote pour continuer ou passer au vote final</li>
                        <li>Phase de questions déléguées (optionnel)</li>
                        <li>Vote final pour désigner l'intrus</li>
                        <li>Révélation et scores</li>
                    </ol>
                </div>
                <button class="primary-btn" onclick="this.parentElement.remove()">Compris !</button>
            </div>
        `;
        
        const helpModal = Utils.createElement('div', 'modal-overlay');
        helpModal.innerHTML = helpContent;
        helpModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        const modal = helpModal.querySelector('.help-modal');
        modal.style.cssText = `
            background: var(--white);
            padding: 2rem;
            border-radius: var(--radius-2xl);
            max-width: 500px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: var(--shadow-large);
        `;
        
        document.body.appendChild(helpModal);
        Utils.popIn(modal);
        
        // Close on overlay click
        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) {
                helpModal.remove();
            }
        });
    }

    handlePageHidden() {
        // Pause any ongoing animations or sounds
        console.log('Page hidden - pausing game');
    }

    handlePageVisible() {
        // Resume animations or refresh state
        console.log('Page visible - resuming game');
    }

    handleResize() {
        // Handle responsive adjustments if needed
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        // Adjust layouts for very small screens
        if (viewport.width < 480) {
            document.body.classList.add('mobile-small');
        } else {
            document.body.classList.remove('mobile-small');
        }
        
        // Adjust for landscape mobile
        if (viewport.width > viewport.height && viewport.height < 500) {
            document.body.classList.add('landscape-mobile');
        } else {
            document.body.classList.remove('landscape-mobile');
        }
    }

    // Public methods for screen navigation
    navigateTo(screenId, data = null) {
        this.currentScreen = screenId;

  switch (screenId) {
    case 'lobby-screen':
      window.LobbyScreen?.show?.();      // ne fait rien sur game.html
      break;
    case 'role-screen':
      RoleAssignmentScreen.show();
      break;
    case 'questions-phase1-screen':
      QuestionsPhase1Screen.show();
      break;
    case 'vote-continue-screen':
      VoteContinueScreen.show();
      break;
    case 'questions-phase2-screen':
      QuestionsPhase2Screen.show();
      break;
    case 'final-vote-screen':
      FinalVoteScreen.show();
      break;
    case 'results-screen':
      ResultsScreen.show();
      break;
    default:
      console.warn(`Unknown screen: ${screenId}`);
  }
}

debugReturnToLobby() {
  if (confirm('Retourner au lobby ? (Mode debug)')) {
    gameState.reset();
    Utils.showScreen('lobby-screen');
    window.LobbyScreen?.show?.();        // guard
    Utils.showNotification('Retour au lobby (debug)', 'info');
  }
    }

    // Utility method to get current game info
    getGameInfo() {
        return {
            currentScreen: this.currentScreen,
            gamePhase: gameState.gamePhase,
            playerCount: gameState.players.length,
            roomId: gameState.currentRoom
        };
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Global app instance
    window.intrusGame = new IntrusGameApp();
    
    // Add some global styles for mobile responsiveness
    const mobileStyles = Utils.createElement('style');
    mobileStyles.textContent = `
        .mobile-small .main-title {
            font-size: 1.75rem;
        }
        
        .mobile-small .game-card {
            padding: 1rem;
        }
        
        .mobile-small .vote-btn {
            padding: 1rem 1.5rem;
            font-size: 1.25rem;
        }
        
        .landscape-mobile {
            font-size: 0.9rem;
        }
        
        .landscape-mobile .screen {
            padding: 10px;
        }
        
        .landscape-mobile .main-title {
            font-size: 1.5rem;
            margin-bottom: 1rem;
        }
        
        /* Smooth scrolling */
        html {
            scroll-behavior: smooth;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
            width: 6px;
        }
        
        ::-webkit-scrollbar-track {
            background: var(--gray-soft);
            border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb {
            background: var(--orange-soft);
            border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
            background: var(--orange-hover);
        }
    `;
    
    document.head.appendChild(mobileStyles);
    
    console.log('🎮 Intrus Game initialized successfully!');
});
