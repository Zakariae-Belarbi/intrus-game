// Results Screen Management
const ResultsScreen = {
    resultsData: null,

    init() {
        this.bindEvents();
    },

    bindEvents() {
        const playAgainBtn = Utils.getElementById('play-again-btn');
        const backLobbyBtn = Utils.getElementById('back-lobby-btn');
        
        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => {
                this.playAgain();
            });
        }
        
        if (backLobbyBtn) {
            backLobbyBtn.addEventListener('click', () => {
                this.backToLobby();
            });
        }
    },

    displayResults(data) {
        this.resultsData = data;
        
        // Réinitialiser le bouton "Continuer à jouer" pour les parties suivantes
        const playAgainBtn = Utils.getElementById('play-again-btn');
        const playAgainCounter = document.getElementById('play-again-counter');
        
        if (playAgainBtn) {
            playAgainBtn.disabled = false;
            playAgainBtn.textContent = t('results.continue_playing');
            playAgainBtn.style.opacity = '1';
        }
        
        if (playAgainCounter) {
            playAgainCounter.textContent = '';
            playAgainCounter.style.display = 'none';
        }
        
        this.revealIntruder(data.intruder, data.intruderCaught, data.intruderGuessedCorrectly, data.correctAnimal);
        
        setTimeout(() => {
            this.displayScores(data.scores, data.cumulativeScores, data.gamesPlayed);
        }, 2000);
        
        setTimeout(() => {
            this.showActionButtons();
        }, 4000);
    },

    showResults() {
        // Fallback si appelé sans data (ne devrait pas arriver en online)
        if (!this.resultsData) {
            console.warn('[ResultsScreen] Pas de données - utilisation du gameState');
            const intruder = window.gameState?.intruder;
            const scores = window.gameState?.scores || {};
            this.displayResults({ intruder, intruderCaught: false, scores });
            return;
        }
        this.displayResults(this.resultsData);
    },

    revealIntruder(intruder, intruderCaught, intruderGuessedCorrectly, correctAnimal) {
        const intruderReveal = document.querySelector('.intruder-reveal');
        const revealedIntruder = Utils.getElementById('revealed-intruder');
        
        if (!intruderReveal || !revealedIntruder) return;
        
        // Initially hide the reveal
        intruderReveal.style.opacity = '0';
        intruderReveal.style.transform = 'rotateY(90deg)';
        
        setTimeout(() => {
            // Set intruder name
            revealedIntruder.textContent = intruder?.name || t('results.unknown');
            
            // Add flip animation
            intruderReveal.style.transition = 'all 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            intruderReveal.style.opacity = '1';
            intruderReveal.style.transform = 'rotateY(0deg)';
            
            // Ajouter info sur l'animal si l'intrus a joué
            if (correctAnimal !== undefined) {
                const intruderInfo = intruderReveal.querySelector('.intruder-info');
                const animalResult = document.createElement('div');
                animalResult.style.cssText = 'margin-top: 1rem; padding: 1rem; background: rgba(255,255,255,0.9); border-radius: 12px;';

                if (intruderGuessedCorrectly) {
                    animalResult.innerHTML = `
                        <p style="font-size: 0.9rem; color: var(--success); font-weight: 600;">
                            ${Utils.escapeHTML(t('results.intruder_found_animal', { animal: correctAnimal }))}
                        </p>
                    `;
                } else {
                    animalResult.innerHTML = `
                        <p style="font-size: 0.9rem; color: var(--error); font-weight: 600;">
                            ${Utils.escapeHTML(t('results.intruder_not_found_animal'))}
                        </p>
                        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.5rem;">
                            ${Utils.escapeHTML(t('results.animal_was', { animal: correctAnimal }))}
                        </p>
                    `;
                }
                
                intruderInfo?.appendChild(animalResult);
            }
            
            // Change color based on caught status OR if intruder won by guessing
            if (intruderCaught) {
                intruderReveal.style.borderColor = 'var(--success)';
                revealedIntruder.style.color = 'var(--success)';
            } else if (intruderGuessedCorrectly) {
                intruderReveal.style.borderColor = 'var(--warning)';
                revealedIntruder.style.color = 'var(--warning)';
            } else {
                intruderReveal.style.borderColor = 'var(--error)';
                revealedIntruder.style.color = 'var(--error)';
            }
            
            Utils.playSuccessSound();
            
            // Add celebration effect
            this.addCelebrationEffects();
            
        }, 500);
    },

    addCelebrationEffects() {
        // Add confetti effect
        const intruderIcon = document.querySelector('.intruder-icon');
        if (intruderIcon) {
            intruderIcon.classList.add('wiggle');
        }
        
        // Create floating emojis
        const emojis = ['🎉', '◆', '🎊', '🎈'];
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                this.createFloatingEmoji(Utils.getRandomElement(emojis));
            }, i * 150);
        }
        
        // Flash background
        setTimeout(() => {
            const reveal = document.querySelector('.intruder-reveal');
            if (reveal) {
                reveal.classList.add('success-flash');
                
                setTimeout(() => {
                    reveal.classList.remove('success-flash');
                }, 600);
            }
        }, 1000);
    },

    createFloatingEmoji(emoji) {
        const floatingEmoji = Utils.createElement('div', 'floating-emoji');
        floatingEmoji.textContent = emoji;
        
        floatingEmoji.style.cssText = `
            position: fixed;
            font-size: 2rem;
            pointer-events: none;
            z-index: 1000;
            left: ${Math.random() * window.innerWidth}px;
            top: ${window.innerHeight}px;
            animation: floatUp 3s ease-out forwards;
        `;
        
        document.body.appendChild(floatingEmoji);
        
        setTimeout(() => {
            if (floatingEmoji.parentNode) {
                floatingEmoji.parentNode.removeChild(floatingEmoji);
            }
        }, 3000);
    },

    displayScores(scores, cumulativeScores = null, gamesPlayed = 0) {
        const scoresTable = Utils.getElementById('scores-table');
        if (!scoresTable) return;
        
        scoresTable.innerHTML = '';
        
        // Afficher l'en-tête avec le numéro de partie si applicable
        if (gamesPlayed > 0) {
            const headerDiv = Utils.createElement('div', 'scores-header');
            headerDiv.style.cssText = 'text-align: center; margin-bottom: 1.5rem; padding: 1rem; background: rgba(255,255,255,0.5); border-radius: 12px;';
            headerDiv.innerHTML = `
                <h3 style="margin: 0; font-size: 1.1rem; color: var(--text-primary);">
                    ${Utils.escapeHTML(gamesPlayed === 1 ? t('results.first_game') : t('results.game_number', { number: gamesPlayed }))}
                </h3>
            `;
            scoresTable.appendChild(headerDiv);
        }
        
        const players = window.gameState?.players || [];
        
        // Sort players by cumulative score if available, otherwise by round score
        const sortedPlayers = [...players].sort((a, b) => {
            if (cumulativeScores) {
                const cumulA = cumulativeScores[a.id] || 0;
                const cumulB = cumulativeScores[b.id] || 0;
                return cumulB - cumulA;
            } else {
                const scoreA = scores[a.id] || 0;
                const scoreB = scores[b.id] || 0;
                return scoreB - scoreA;
            }
        });
        
        sortedPlayers.forEach((player, index) => {
            const score = Number(scores[player.id] || 0);
            const cumulScore = cumulativeScores ? Number(cumulativeScores[player.id] || 0) : null;
            const safeAvatar = Utils.escapeHTML(player.avatar || '🙂');
            const safeName = Utils.escapeHTML(player.name || 'Joueur');
            
            const scoreCard = Utils.createElement('div', 'score-card fade-in hover-lift');
            scoreCard.style.animationDelay = `${index * 0.1}s`;
            
            // Add special styling for intruder and winners
            let cardClass = '';
            let badge = '';
            
            const isIntruder = this.resultsData?.intruder?.id === player.id;
            if (isIntruder) {
                cardClass = 'intruder-card';
                badge = score > 0 ? t('results.intruder_victorious') : t('results.intruder_discovered');
            } else if (score >= 2) {
                cardClass = 'winner-card';
                badge = t('results.winner');
            }
            
            scoreCard.className += ` ${cardClass}`;
            
            // Construire le HTML avec scores cumulés si disponibles
            let scoreHTML = `<div class="score-points">${Utils.escapeHTML(t('results.points', { points: score }))}</div>`;
            if (cumulScore !== null && gamesPlayed > 1) {
                scoreHTML = `
                    <div class="score-breakdown">
                        <div class="score-round" style="font-size: 0.9rem; color: var(--text-secondary);">
                            ${Utils.escapeHTML(t('results.points_this_game', { points: score }))}
                        </div>
                        <div class="score-total" style="font-size: 1.2rem; font-weight: 700; color: var(--text-primary); margin-top: 0.25rem;">
                            ${Utils.escapeHTML(t('results.points_total', { points: cumulScore }))}
                        </div>
                    </div>
                `;
            } else if (cumulScore !== null) {
                scoreHTML = `<div class="score-points">${Utils.escapeHTML(t('results.points', { points: cumulScore }))}</div>`;
            }
            
            scoreCard.innerHTML = `
                <div class="score-avatar">${safeAvatar}</div>
                <div class="score-name">${safeName}</div>
                ${badge ? `<div class="score-badge">${Utils.escapeHTML(badge)}</div>` : ''}
                ${scoreHTML}
            `;
            
            // Add special effects for top scorer
            if (index === 0 && (cumulScore || score) > 0) {
                setTimeout(() => {
                    Utils.pulse(scoreCard);
                    scoreCard.style.border = '2px solid var(--success)';
                }, 500);
            }
            
            scoresTable.appendChild(scoreCard);
            
            // Animate in
            setTimeout(() => {
                Utils.fadeIn(scoreCard, index * 150);
            }, 100);
        });
        
        // Add CSS for special card types
        this.addScoreCardStyles();
    },

    addScoreCardStyles() {
        if (document.getElementById('results-styles')) return;
        
        const styles = Utils.createElement('style');
        styles.id = 'results-styles';
        styles.textContent = `
            .score-card.intruder-card {
                background: linear-gradient(135deg, var(--red-pastel), #FEF2F2);
                border: 2px solid var(--error);
            }
            
            .score-card.winner-card {
                background: linear-gradient(135deg, var(--green-pastel), #F0FDF4);
                border: 2px solid var(--success);
            }
            
            .score-badge {
                font-size: 0.75rem;
                font-weight: 600;
                padding: 0.25rem 0.5rem;
                border-radius: var(--radius-md);
                margin: 0.5rem 0;
                background: var(--orange-soft);
                color: var(--gray-dark);
            }
            
            .floating-emoji {
                animation: floatUp 3s ease-out forwards;
            }
            
            @keyframes floatUp {
                0% {
                    transform: translateY(0) rotate(0deg);
                    opacity: 1;
                }
                100% {
                    transform: translateY(-100vh) rotate(360deg);
                    opacity: 0;
                }
            }
        `;
        
        document.head.appendChild(styles);
    },

    showActionButtons() {
        const actionButtons = document.querySelector('.action-buttons');
        if (!actionButtons) return;
        
        actionButtons.style.opacity = '0';
        actionButtons.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            actionButtons.style.transition = 'all 0.5s ease';
            actionButtons.style.opacity = '1';
            actionButtons.style.transform = 'translateY(0)';
            
            // Add bounce animations to buttons
            const playAgainBtn = Utils.getElementById('play-again-btn');
            const backLobbyBtn = Utils.getElementById('back-lobby-btn');
            
            if (playAgainBtn) Utils.bounce(playAgainBtn);
            setTimeout(() => {
                if (backLobbyBtn) Utils.bounce(backLobbyBtn);
            }, 200);
            
        }, 100);
        
        // Ajouter les crédits après les boutons d'action
        setTimeout(() => {
            this.addCredits();
        }, 1000);
    },
    
    addCredits() {
        // Vérifier si les crédits n'existent pas déjà
        if (document.getElementById('game-credits')) return;
        
        const resultsScreen = document.getElementById('results-screen');
        if (!resultsScreen) return;
        
        const creditsDiv = Utils.createElement('div');
        creditsDiv.id = 'game-credits';
        creditsDiv.style.cssText = `
            text-align: center;
            margin-top: 3rem;
            padding: 2rem;
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(236, 72, 153, 0.1));
            border-radius: 16px;
            border: 2px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.6s ease;
        `;
        
        creditsDiv.innerHTML = `
            <a href="https://linktr.ee/Zakariae_Belarbi" 
               target="_blank" 
               rel="noopener noreferrer"
               style="
                   display: inline-block;
                   font-size: 1rem;
                   color: var(--primary);
                   text-decoration: none;
                   font-weight: 600;
                   margin-bottom: 0.5rem;
                   transition: all 0.3s ease;
                   padding: 0.5rem 1rem;
                   border-radius: 8px;
               "
               onmouseover="this.style.background='rgba(99, 102, 241, 0.1)'; this.style.transform='translateY(-2px)';"
               onmouseout="this.style.background='transparent'; this.style.transform='translateY(0)';">
                👋 Click here to say hello :)
            </a>
            <p style="
                font-size: 0.9rem;
                color: var(--text-secondary);
                margin: 0;
                font-weight: 500;
            ">
                Made by Belarbi Zakariae
            </p>
        `;
        
        const container = resultsScreen.querySelector('.container');
        if (container) {
            container.appendChild(creditsDiv);
            
            // Animer l'apparition
            setTimeout(() => {
                creditsDiv.style.opacity = '1';
                creditsDiv.style.transform = 'translateY(0)';
            }, 100);
        }
    },

    playAgain() {
        Utils.playClickSound();
        
        const roomId = window.gameState?.roomId;
        if (!roomId) {
            Utils.showNotification(t('results.cannot_replay'), 'error');
            return;
        }
        
        // Émettre le vote pour continuer
        window.socket.emit('play:again', { roomId });
        
        // Désactiver le bouton et afficher le statut
        const playAgainBtn = Utils.getElementById('play-again-btn');
        if (playAgainBtn) {
            playAgainBtn.disabled = true;
            playAgainBtn.textContent = t('results.waiting');
            playAgainBtn.style.opacity = '0.6';
        }
        
        // Remonter automatiquement en haut de la page pour voir le rôle
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        Utils.showNotification(t('results.vote_saved_waiting'), 'info');
    },

    backToLobby() {
        Utils.showNotification(t('results.back_lobby'), 'info');
        Utils.playClickSound();
        
        // Nettoyer le contexte
        sessionStorage.removeItem('intrus_ctx');
        
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
    },

    disableContinueButton(message) {
        const playAgainBtn = Utils.getElementById('play-again-btn');
        if (!playAgainBtn) return;
        
        // Désactiver le bouton
        playAgainBtn.disabled = true;
        playAgainBtn.style.opacity = '0.5';
        playAgainBtn.style.cursor = 'not-allowed';
        playAgainBtn.textContent = t('results.cannot_continue');
        
        // Afficher le message d'erreur sous le bouton
        const btnContainer = playAgainBtn.parentElement;
        if (btnContainer) {
            let errorMsg = btnContainer.querySelector('.continue-error-msg');
            if (!errorMsg) {
                errorMsg = document.createElement('p');
                errorMsg.className = 'continue-error-msg';
                errorMsg.style.color = '#ff4444';
                errorMsg.style.fontSize = '0.9em';
                errorMsg.style.marginTop = '10px';
                errorMsg.style.textAlign = 'center';
                btnContainer.appendChild(errorMsg);
            }
            errorMsg.textContent = message;
        }
    },

    show() {
        Utils.showScreen('results-screen');
        this.showResults();
    }
};

// Exposer globalement pour que realtime.js puisse l'utiliser
window.ResultsScreen = ResultsScreen;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    ResultsScreen.init();
});
