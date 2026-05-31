// Final Vote Screen Management
const FinalVoteScreen = {
    selectedSuspect: null,
    hasVoted: false,

    init() {
        this.bindEvents();
    },

    bindEvents() {
        // Submit vote button
        const submitBtn = Utils.getElementById('submit-vote-btn');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                this.submitVote();
            });
        }
    },

    startVote() {
        this.selectedSuspect = null;
        this.hasVoted = false;
        this.renderSuspects();
        this.updateSubmitButton();
        
        // Add entrance animation
        const container = document.querySelector('.vote-final-container');
        if (container) {
            container.style.opacity = '0';
            container.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                container.style.transition = 'all 0.5s ease';
                container.style.opacity = '1';
                container.style.transform = 'translateY(0)';
            }, 100);
        }
    },

    renderSuspects() {
        const suspectsList = Utils.getElementById('suspects-list');
        if (!suspectsList) return;
        
        suspectsList.innerHTML = '';
        
        const players = window.gameState?.players || [];
        const currentPlayer = window.gameState?.currentPlayer;
        
        // Filtrer pour exclure le joueur actuel (on ne peut pas voter pour soi-même)
        const otherPlayers = players.filter(p => p.id !== currentPlayer?.id);
        
        if (otherPlayers.length === 0) {
            suspectsList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Aucun suspect disponible</p>';
            return;
        }
        
        otherPlayers.forEach((player, index) => {
            const suspectOption = Utils.createElement('div', 'suspect-option hover-lift');
            suspectOption.style.animationDelay = `${index * 0.1}s`;
            
            suspectOption.innerHTML = `
                <input type="radio" name="suspect" value="${player.id}" class="suspect-radio" id="suspect-${player.id}">
                <div class="suspect-avatar">${player.avatar || '🙂'}</div>
                <div class="suspect-name">${player.name || 'Joueur'}</div>
            `;
            
            // Add click handler
            suspectOption.addEventListener('click', () => {
                this.selectSuspect(player.id, suspectOption);
            });

            suspectsList.appendChild(suspectOption);
            
            // Animate in
            setTimeout(() => {
                Utils.fadeIn(suspectOption, index * 100);
            }, 50);
        });
    },

    selectSuspect(playerId, optionElement) {
        if (this.hasVoted) {
            Utils.showNotification('Vous avez déjà voté !', 'error');
            Utils.playErrorSound();
            return;
        }

        // Remove previous selection
        document.querySelectorAll('.suspect-option').forEach(option => {
            option.classList.remove('selected');
        });

        // Select current option
        optionElement.classList.add('selected');
        const radio = optionElement.querySelector('.suspect-radio');
        if (radio) radio.checked = true;
        
        this.selectedSuspect = playerId;
        this.updateSubmitButton();
        
        // Play selection sound and animation
        Utils.playClickSound();
        Utils.bounce(optionElement);
        
        const player = window.gameState?.getPlayerById(playerId);
        if (player) {
            Utils.showNotification(`${player.name} sélectionné`, 'info');
        }
    },

    updateSubmitButton() {
        const submitButton = Utils.getElementById('submit-vote-btn');
        if (!submitButton) return;
        
        if (this.selectedSuspect && !this.hasVoted) {
            submitButton.disabled = false;
            submitButton.style.opacity = '1';
            submitButton.style.cursor = 'pointer';
            Utils.pulse(submitButton);
        } else {
            submitButton.disabled = true;
            submitButton.style.opacity = '0.5';
            submitButton.style.cursor = 'not-allowed';
            Utils.stopPulse(submitButton);
        }
    },

    submitVote() {
        if (!this.selectedSuspect) {
            Utils.showNotification('Veuillez sélectionner un suspect', 'error');
            Utils.playErrorSound();
            return;
        }

        if (this.hasVoted) {
            Utils.showNotification('Vous avez déjà voté !', 'error');
            Utils.playErrorSound();
            return;
        }

        // Envoyer le vote au serveur
        if (window.realtime?.voteFinal) {
            window.realtime.voteFinal(this.selectedSuspect);
        }
        
        this.hasVoted = true;
        this.disableVoting();
        
        const suspectedPlayer = window.gameState?.getPlayerById(this.selectedSuspect);
        Utils.showNotification(`Vote confirmé : ${suspectedPlayer?.name || 'Joueur'}`, 'success');
        Utils.playSuccessSound();
    },

    disableVoting() {
        document.querySelectorAll('.suspect-option').forEach(option => {
            option.style.pointerEvents = 'none';
            option.style.opacity = '0.7';
        });
        
        // Keep selected option highlighted
        const selectedOption = document.querySelector('.suspect-option.selected');
        if (selectedOption) {
            selectedOption.style.opacity = '1';
            selectedOption.style.transform = 'scale(1.05)';
        }
        
        this.updateSubmitButton();
    },

    updateVoteCount(count, total) {
        // Afficher la progression (optionnel)
        Utils.showNotification(`${count}/${total} votes reçus`, 'info');
    },

    show() {
        Utils.showScreen('final-vote-screen');
        this.startVote();
    }
};

// Exposer globalement pour que realtime.js puisse l'utiliser
window.FinalVoteScreen = FinalVoteScreen;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    FinalVoteScreen.init();
});