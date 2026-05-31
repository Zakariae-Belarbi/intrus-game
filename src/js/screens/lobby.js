// Lobby Screen Management
const LobbyScreen = {
    init() {
        this.bindEvents();
        this.generateNewRoomId();
        this.updateUI();
    },

    bindEvents() {
        // Create room button
        Utils.getElementById('create-room-btn').addEventListener('click', () => {
            this.createRoom();
        });

        // Join room button
        Utils.getElementById('join-room-btn').addEventListener('click', () => {
            this.joinRoom();
        });

        // Copy room ID button
        Utils.getElementById('copy-room-id').addEventListener('click', () => {
            this.copyRoomId();
        });

        // Add player button
        Utils.getElementById('add-player-btn').addEventListener('click', () => {
            this.addPlayer();
        });

        // Enter key in player input
        Utils.getElementById('player-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addPlayer();
            }
        });

        // Enter key in join room input
        Utils.getElementById('join-room-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.joinRoom();
            }
        });

        // Start game button
        Utils.getElementById('start-game-btn').addEventListener('click', () => {
            this.startGame();
        });
    },

    generateNewRoomId() {
        const roomId = gameState.generateRoomId();
        Utils.getElementById('generated-room-id').textContent = roomId;
        return roomId;
    },

    createRoom() {
        const roomId = gameState.createRoom();
        Utils.getElementById('generated-room-id').textContent = roomId;
        
        Utils.showNotification('Salle créée avec succès !', 'success');
        Utils.playSuccessSound();
        
        // Add animation to the room ID
        const roomIdElement = Utils.getElementById('generated-room-id');
        Utils.bounce(roomIdElement);
        
        this.updateUI();
    },

    joinRoom() {
        const roomInput = Utils.getElementById('join-room-input');
        const roomId = roomInput.value.trim().toUpperCase();
        
        if (!Utils.validateRoomId(roomId)) {
            Utils.showNotification('ID de salle invalide. Format: XXXXX-1234', 'error');
            Utils.playErrorSound();
            Utils.wiggle(roomInput);
            return;
        }

        const success = gameState.joinRoom(roomId);
        
        if (success) {
            Utils.showNotification(`Rejoint la salle ${roomId}`, 'success');
            Utils.playSuccessSound();
            roomInput.value = '';
            this.updateUI();
        } else {
            Utils.showNotification('Impossible de rejoindre cette salle', 'error');
            Utils.playErrorSound();
            Utils.wiggle(roomInput);
        }
    },

    async copyRoomId() {
        const roomId = Utils.getElementById('generated-room-id').textContent;
        const success = await Utils.copyToClipboard(roomId);
        
        if (success) {
            Utils.showNotification('ID copié dans le presse-papiers !', 'success');
            Utils.playSuccessSound();
            
            const copyButton = Utils.getElementById('copy-room-id');
            copyButton.textContent = '✓';
            Utils.bounce(copyButton);
            
            setTimeout(() => {
                copyButton.textContent = '📋';
            }, 2000);
        } else {
            Utils.showNotification('Erreur lors de la copie', 'error');
            Utils.playErrorSound();
        }
    },

    addPlayer() {
        const nameInput = Utils.getElementById('player-name');
        const playerName = nameInput.value.trim();
        
        if (!Utils.validatePlayerName(playerName)) {
            Utils.showNotification('Le nom doit contenir 2-20 caractères', 'error');
            Utils.playErrorSound();
            Utils.wiggle(nameInput);
            return;
        }

        // Check for duplicate names
        const existingPlayer = gameState.players.find(p => 
            p.name.toLowerCase() === playerName.toLowerCase()
        );
        
        if (existingPlayer) {
            Utils.showNotification('Ce nom est déjà pris', 'error');
            Utils.playErrorSound();
            Utils.wiggle(nameInput);
            return;
        }

        const player = gameState.addPlayer(playerName);
        
        if (player) {
            Utils.showNotification(`${playerName} a rejoint la partie !`, 'success');
            Utils.playSuccessSound();
            nameInput.value = '';
            this.renderPlayers();
            this.updateStartButton();
        } else {
            Utils.showNotification('Nombre maximum de joueurs atteint (8)', 'error');
            Utils.playErrorSound();
        }
    },

    renderPlayers() {
        const container = Utils.getElementById('players-container');
        container.innerHTML = '';

        gameState.players.forEach((player, index) => {
            const playerCard = Utils.createElement('div', 'player-card fade-in');
            playerCard.style.animationDelay = `${index * 0.1}s`;
            
            playerCard.innerHTML = `
                <div class="player-avatar">${player.avatar}</div>
                <div class="player-name">${Utils.truncateText(player.name, 12)}</div>
            `;

            // Add hover effect
            playerCard.addEventListener('mouseenter', () => {
                Utils.playSound(600, 80);
            });

            // Add click to remove (only for current player)
            if (player === gameState.currentPlayer) {
                playerCard.style.cursor = 'pointer';
                playerCard.title = 'Cliquer pour retirer';
                playerCard.addEventListener('click', () => {
                    this.removePlayer(player.id);
                });
            }

            container.appendChild(playerCard);
            
            // Trigger animation
            setTimeout(() => {
                Utils.fadeIn(playerCard, index * 100);
            }, 10);
        });
    },

    removePlayer(playerId) {
        gameState.removePlayer(playerId);
        Utils.showNotification('Joueur retiré', 'info');
        Utils.playClickSound();
        this.renderPlayers();
        this.updateStartButton();
    },

    updateStartButton() {
        const startButton = Utils.getElementById('start-game-btn');
        const playerCount = gameState.players.length;
        const countSpan = startButton.querySelector('.player-count');
        
        countSpan.textContent = `(${playerCount}/8)`;
        
        if (playerCount >= 3) {
            startButton.classList.remove('disabled');
            startButton.style.cursor = 'pointer';
            Utils.pulse(startButton);
        } else {
            startButton.classList.add('disabled');
            startButton.style.cursor = 'not-allowed';
            Utils.stopPulse(startButton);
        }
    },

    startGame() {
        if (gameState.players.length < 3) {
            Utils.showNotification('Il faut au moins 3 joueurs pour commencer', 'error');
            Utils.playErrorSound();
            return;
        }

        const success = gameState.startGame();
        
        if (success) {
            Utils.showNotification('La partie commence !', 'success');
            Utils.playSuccessSound();
            
            // Add exciting transition effect
            const startButton = Utils.getElementById('start-game-btn');
            startButton.textContent = 'Démarrage...';
            Utils.setLoading(startButton, true);
            
            setTimeout(() => {
                Utils.showScreen('role-screen', 'slide');
                RoleAssignmentScreen.displayRole();
            }, 1500);
        }
    },

    updateUI() {
        this.renderPlayers();
        this.updateStartButton();
        
        // Update room display if joined
        if (gameState.currentRoom) {
            Utils.getElementById('generated-room-id').textContent = gameState.currentRoom;
        }
    },

    show() {
        Utils.showScreen('lobby-screen');
        this.updateUI();
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    LobbyScreen.init();
});