/* Tutorial/Welcome Guide Component */

const Tutorial = {
    init() {
        // Check if user has seen tutorial before
        const hasSeenTutorial = localStorage.getItem('intrus_tutorial_seen');
        
        if (!hasSeenTutorial) {
            this.show();
        }
    },

    show() {
        // Create tutorial overlay if it doesn't exist
        if (!document.getElementById('tutorial-overlay')) {
            this.createTutorial();
        }
        
        const overlay = document.getElementById('tutorial-overlay');
        if (overlay) {
            setTimeout(() => {
                overlay.classList.add('active');
            }, 500); // Delay for smooth entrance
        }
    },

    hide() {
        const overlay = document.getElementById('tutorial-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            
            // Mark tutorial as seen
            localStorage.setItem('intrus_tutorial_seen', 'true');
            
            // Remove from DOM after animation
            setTimeout(() => {
                overlay.remove();
            }, 500);
        }
    },

    reset() {
        localStorage.removeItem('intrus_tutorial_seen');
    },

    createTutorial() {
        const overlay = document.createElement('div');
        overlay.id = 'tutorial-overlay';
        overlay.className = 'tutorial-overlay';
        
        overlay.innerHTML = `
            <div class="tutorial-modal">
                <div class="tutorial-header">
                    <button class="tutorial-close" onclick="Tutorial.hide()">✕</button>
                    <h2>🎮 Bienvenue dans Intrus Game !</h2>
                    <p>Découvrez comment jouer en quelques étapes simples</p>
                </div>
                
                <div class="tutorial-content">
                    <div class="tutorial-step">
                        <div class="tutorial-step-icon">👥</div>
                        <div class="tutorial-step-content">
                            <h3>1. Créez ou rejoignez une salle</h3>
                            <p>Minimum 3 joueurs requis. Un joueur crée la salle et partage le code aux autres.</p>
                        </div>
                    </div>
                    
                    <div class="tutorial-step">
                        <div class="tutorial-step-icon">🎭</div>
                        <div class="tutorial-step-content">
                            <h3>2. Découvrez votre rôle</h3>
                            <p>Chaque joueur reçoit un animal. Un joueur est secrètement <strong>l'intrus</strong> avec un animal différent !</p>
                        </div>
                    </div>
                    
                    <div class="tutorial-step">
                        <div class="tutorial-step-icon">❓</div>
                        <div class="tutorial-step-content">
                            <h3>3. Posez des questions</h3>
                            <p>En 2 phases, posez des questions Oui/Non pour identifier l'intrus. Soyez stratégique dans vos questions !</p>
                        </div>
                    </div>
                    
                    <div class="tutorial-step">
                        <div class="tutorial-step-icon">🗳️</div>
                        <div class="tutorial-step-content">
                            <h3>4. Votez pour l'intrus</h3>
                            <p>Après les questions, votez pour qui vous pensez être l'intrus. Points bonus si vous trouvez correctement !</p>
                        </div>
                    </div>
                </div>
                
                <div class="tutorial-footer">
                    <button class="tutorial-start-btn" onclick="Tutorial.hide()">
                        Commencer à jouer ! 🚀
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
    }
};

// Make Tutorial globally accessible
window.Tutorial = Tutorial;
