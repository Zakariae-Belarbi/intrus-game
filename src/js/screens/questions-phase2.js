// Questions Phase 2 - Mode Online
const QuestionsPhase2Screen = {
    currentTurn: 0,
    maxTurns: 0,
    isMyTurn: false,
    waitingForAnswer: false,
    currentQuestionerId: null,
    currentTargetId: null,

    init() {
        console.log('[Phase2] init');
        this.bindEvents();
    },

    bindEvents() {
        const askBtn = Utils.getElementById('ask-delegated-btn');
        if (askBtn) {
            askBtn.addEventListener('click', () => this.askDelegatedQuestion());
        }

        const questionInput = Utils.getElementById('delegated-question-input');
        if (questionInput) {
            questionInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.askDelegatedQuestion();
            });
        }

        const targetSelect = Utils.getElementById('target-select');
        if (targetSelect) {
            targetSelect.addEventListener('change', () => this.updateAskButton());
        }
    },

    startPhase() {
        console.log('[Phase2] startPhase called');
        this.currentTurn = 0;
        this.isMyTurn = false;
        this.waitingForAnswer = false;
        this.clearThread();
        this.disableAllInputs();
        Utils.showNotification?.('Phase 2 : Questions déléguées', 'info');
    },

    onNewTurn({ questionerId, availableTargets, turnIndex, totalTurns } = {}) {
        console.log('[Phase2] onNewTurn', { questionerId, availableTargets, turnIndex, totalTurns });
        
        this.currentTurn = turnIndex || 0;
        this.maxTurns = totalTurns || 0;
        this.currentQuestionerId = questionerId;
        this.currentTargetId = null;
        this.waitingForAnswer = false;
        
        // ✅ Réinitialiser la protection contre les duplications pour un nouveau tour
        this.lastDisplayedQuestion = null;
        this.lastDisplayedTime = null;
        
        // ✅ Nettoyer le thread des questions/réponses précédentes
        const thread = Utils.getElementById('delegated-thread');
        if (thread) {
            thread.innerHTML = '';
        }
        
        const me = window.gameState?.currentPlayer;
        this.isMyTurn = (me?.id === questionerId);
        
        console.log('[Phase2] My ID:', me?.id, 'Questioner ID:', questionerId, 'Is my turn:', this.isMyTurn);
        
        // Update progress
        const turnEl = Utils.getElementById('phase2-turn');
        const totalEl = Utils.getElementById('phase2-total');
        if (turnEl) turnEl.textContent = (turnIndex + 1) || 1;
        if (totalEl) totalEl.textContent = totalTurns || 0;
        
        // Update questioner name with animation
        const questioner = window.gameState?.getPlayerById(questionerId);
        const questionerEl = Utils.getElementById('current-questioner');
        console.log('[Phase2] Questioner:', questioner);
        if (questionerEl) {
            questionerEl.textContent = questioner?.name || 'Joueur';
            const tag = questionerEl.parentElement;
            if (tag) {
                tag.style.transform = 'scale(0.95)';
                setTimeout(() => { tag.style.transform = 'scale(1)'; }, 150);
            }
        }
        
        // Configure interface based on role
        if (this.isMyTurn) {
            this.enableQuestionInput();
            this.populateTargetSelect(availableTargets || []);
            Utils.showNotification?.('🎤 À vous de poser une question !', 'info');
        } else {
            this.disableAllInputs();
            const questionerName = questioner?.name || 'Un joueur';
            Utils.showNotification?.(`${questionerName} pose une question...`, 'info');
        }
    },

    onAsked({ questionerId, targetId, question } = {}) {
        console.log('[Phase2] onAsked', { questionerId, targetId, question });
        
        // ✅ Éviter les duplications : vérifier si c'est la même question dans les 2 dernières secondes
        const questionKey = `${questionerId}-${targetId}-${question}`;
        const now = Date.now();
        
        if (this.lastDisplayedQuestion === questionKey && this.lastDisplayedTime && (now - this.lastDisplayedTime) < 2000) {
            console.log('[Phase2] Question déjà affichée récemment, ignorée');
            return;
        }
        
        this.lastDisplayedQuestion = questionKey;
        this.lastDisplayedTime = now;
        
        this.currentTargetId = targetId;
        this.waitingForAnswer = true;
        
        const questioner = window.gameState?.getPlayerById(questionerId);
        const target = window.gameState?.getPlayerById(targetId);
        
        // Display question
        this.displayQuestion(questioner, target, question);
        
        // Disable questioner input
        if (this.isMyTurn) {
            this.disableQuestionInput();
        }
        
        // If I'm the target, enable answer input
        const me = window.gameState?.currentPlayer;
        if (me?.id === targetId) {
            Utils.showNotification?.('💬 Répondez à la question !', 'success');
            this.enableAnswerInput();
        }
    },

    onAnswered({ targetId, answer } = {}) {
        console.log('[Phase2] onAnswered', { targetId, answer });
        
        const target = window.gameState?.getPlayerById(targetId);
        
        // Display answer
        this.displayAnswer(target, answer);
        
        // Disable answer input if I was the target
        const me = window.gameState?.currentPlayer;
        if (me?.id === targetId) {
            this.disableAnswerInput();
        }
        
        this.waitingForAnswer = false;
        
        // Notification: target becomes new questioner
        const targetName = target?.name || 'Joueur';
        setTimeout(() => {
            Utils.showNotification?.(`${targetName} devient le questionneur`, 'info');
        }, 1000);
    },

    askDelegatedQuestion() {
        const questionInput = Utils.getElementById('delegated-question-input');
        const targetSelect = Utils.getElementById('target-select');
        const question = questionInput?.value?.trim();
        const targetId = targetSelect?.value;
        
        console.log('[Phase2] askDelegatedQuestion', { question, targetId });
        
        if (!question || question.length < 2) {
            Utils.showNotification?.('Veuillez saisir une question (minimum 2 caractères)', 'error');
            Utils.playErrorSound?.();
            Utils.wiggle?.(questionInput);
            return;
        }

        if (!targetId) {
            Utils.showNotification?.('Veuillez sélectionner une cible', 'error');
            Utils.playErrorSound?.();
            Utils.wiggle?.(targetSelect);
            return;
        }

        // Send to server
        console.log('[Phase2] Sending question to server...');
        
        // Disable input while waiting for server response
        this.disableQuestionInput();
        
        // Send question (will clear input only on success via realtime.js callback)
        window.realtime?.askPhase2?.(targetId, question);
        
        // Note: Le message de succès et le vidage de l'input seront gérés par realtime.js après confirmation du serveur
    },
    
    answerDelegatedQuestion(answer) {
        console.log('[Phase2] answerDelegatedQuestion', { answer });
        
        if (!answer || !['Oui', 'Non'].includes(answer)) {
            Utils.showNotification?.('Réponse invalide', 'error');
            Utils.playErrorSound?.();
            return;
        }
        
        // Send to server
        console.log('[Phase2] Sending answer to server...');
        window.realtime?.answerPhase2?.(answer);
        
        // Disable buttons
        this.disableAnswerInput();
        
        Utils.showNotification?.('Réponse envoyée !', 'success');
        Utils.playSuccessSound?.();
    },
    
    populateTargetSelect(availableTargets = []) {
        const targetSelect = Utils.getElementById('target-select');
        if (!targetSelect) {
            console.error('[Phase2] Target select not found!');
            return;
        }
        
        console.log('[Phase2] populateTargetSelect', { availableTargets });
        
        // Clear options
        targetSelect.innerHTML = '<option value="">Sélectionner une cible</option>';
        
        // Use available targets from server if provided
        if (availableTargets.length > 0) {
            console.log('[Phase2] Using server targets');
            availableTargets.forEach(({ id }) => {
                const player = window.gameState?.getPlayerById(id);
                console.log('[Phase2] Adding target:', player);
                if (player) {
                    const option = document.createElement('option');
                    option.value = id;
                    option.textContent = player.name || 'Joueur';
                    targetSelect.appendChild(option);
                }
            });
        } else {
            // Fallback: show all players except self
            console.log('[Phase2] Using fallback - all players');
            const allPlayers = window.gameState?.players || [];
            const me = window.gameState?.currentPlayer;
            
            allPlayers.forEach(player => {
                if (player.id !== me?.id) {
                    const option = document.createElement('option');
                    option.value = player.id;
                    option.textContent = player.name || 'Joueur';
                    targetSelect.appendChild(option);
                }
            });
        }

        this.updateAskButton();
    },
    
    updateAskButton() {
        const targetSelect = Utils.getElementById('target-select');
        const askButton = Utils.getElementById('ask-delegated-btn');
        
        if (!askButton) return;
        
        const hasTarget = targetSelect?.value;
        const canAsk = hasTarget && this.isMyTurn && !this.waitingForAnswer;
        
        console.log('[Phase2] updateAskButton', { hasTarget, isMyTurn: this.isMyTurn, waitingForAnswer: this.waitingForAnswer, canAsk });
        
        if (canAsk) {
            askButton.disabled = false;
            askButton.style.opacity = '1';
            askButton.style.cursor = 'pointer';
        } else {
            askButton.disabled = true;
            askButton.style.opacity = '0.5';
            askButton.style.cursor = 'not-allowed';
        }
    },
    
    enableQuestionInput() {
        console.log('[Phase2] enableQuestionInput');
        const input = Utils.getElementById('delegated-question-input');
        const select = Utils.getElementById('target-select');
        
        if (input) {
            input.disabled = false;
            input.placeholder = 'Posez votre question...';
        }
        if (select) select.disabled = false;
        
        this.updateAskButton();
    },
    
    disableQuestionInput() {
        console.log('[Phase2] disableQuestionInput');
        const input = Utils.getElementById('delegated-question-input');
        const btn = Utils.getElementById('ask-delegated-btn');
        const select = Utils.getElementById('target-select');
        
        if (input) {
            input.disabled = true;
            input.placeholder = 'En attente...';
        }
        if (btn) {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        }
        if (select) select.disabled = true;
    },
    
    disableAllInputs() {
        console.log('[Phase2] disableAllInputs');
        this.disableQuestionInput();
        this.disableAnswerInput();
    },
    
    enableAnswerInput() {
        console.log('[Phase2] enableAnswerInput');
        let answerContainer = document.querySelector('.phase2-answer-container');
        
        if (!answerContainer) {
            const mainContainer = document.querySelector('.delegated-question-container');
            answerContainer = document.createElement('div');
            answerContainer.className = 'phase2-answer-container';
            answerContainer.style.cssText = 'margin-top: 1rem; padding: 1rem; background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-radius: 12px; border-left: 4px solid var(--success); animation: slideInUp 0.3s ease;';
            answerContainer.innerHTML = `
                <label style="display: block; margin-bottom: 0.75rem; font-weight: 600; color: var(--success); text-align: center;">
                    💬 Votre réponse :
                </label>
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <button class="primary-btn" id="phase2-answer-yes" style="background: var(--success); min-width: 120px; font-size: 1.1rem;">
                        ✓ Oui
                    </button>
                    <button class="primary-btn" id="phase2-answer-no" style="background: var(--danger); min-width: 120px; font-size: 1.1rem;">
                        ✗ Non
                    </button>
                </div>
            `;
            mainContainer?.appendChild(answerContainer);
            
            const yesBtn = document.querySelector('#phase2-answer-yes');
            const noBtn = document.querySelector('#phase2-answer-no');
            
            yesBtn?.addEventListener('click', () => this.answerDelegatedQuestion('Oui'));
            noBtn?.addEventListener('click', () => this.answerDelegatedQuestion('Non'));
        }
        
        const yesBtn = document.querySelector('#phase2-answer-yes');
        const noBtn = document.querySelector('#phase2-answer-no');
        
        if (yesBtn) {
            yesBtn.disabled = false;
            yesBtn.style.opacity = '1';
            yesBtn.style.cursor = 'pointer';
        }
        if (noBtn) {
            noBtn.disabled = false;
            noBtn.style.opacity = '1';
            noBtn.style.cursor = 'pointer';
        }
        
        answerContainer.style.display = 'block';
    },
    
    disableAnswerInput() {
        console.log('[Phase2] disableAnswerInput');
        const answerContainer = document.querySelector('.phase2-answer-container');
        const yesBtn = document.querySelector('#phase2-answer-yes');
        const noBtn = document.querySelector('#phase2-answer-no');
        
        if (yesBtn) {
            yesBtn.disabled = true;
            yesBtn.style.opacity = '0.5';
            yesBtn.style.cursor = 'not-allowed';
        }
        if (noBtn) {
            noBtn.disabled = true;
            noBtn.style.opacity = '0.5';
            noBtn.style.cursor = 'not-allowed';
        }
        
        if (answerContainer) {
            setTimeout(() => {
                answerContainer.style.display = 'none';
            }, 2000);
        }
    },
    
    clearThread() {
        const thread = Utils.getElementById('delegated-thread');
        if (thread) thread.innerHTML = '';
    },

    displayQuestion(questioner, target, question) {
        const thread = Utils.getElementById('delegated-thread');
        if (!thread) return;
        
        const questionBubble = document.createElement('div');
        questionBubble.className = 'question-bubble';
        questionBubble.style.cssText = 'margin-bottom: 1rem; padding: 1rem; background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); border-radius: 12px; border-left: 4px solid var(--primary); animation: slideInLeft 0.4s ease;';
        questionBubble.innerHTML = `
            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
                <strong>${questioner?.name || 'Joueur'}</strong> 
                <span style="color: var(--primary);">→</span> 
                <strong>${target?.name || 'Joueur'}</strong>
            </div>
            <div style="font-size: 1rem; color: var(--text-primary); font-weight: 500;">${question}</div>
        `;
        
        thread.appendChild(questionBubble);
        thread.scrollTop = thread.scrollHeight;
        Utils.playClickSound?.();
    },
    
    displayAnswer(target, answer) {
        const thread = Utils.getElementById('delegated-thread');
        if (!thread) return;
        
        const answerBubble = document.createElement('div');
        answerBubble.className = 'answer-bubble';
        answerBubble.style.cssText = 'margin-bottom: 1.5rem; padding: 1rem; background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-radius: 12px; border-left: 4px solid var(--success); animation: slideInRight 0.4s ease; margin-left: 2rem;';
        answerBubble.innerHTML = `
            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
                <strong>${target?.name || 'Joueur'}</strong> répond :
            </div>
            <div style="font-size: 1.1rem; font-weight: 600; color: var(--success);">${answer}</div>
        `;
        
        thread.appendChild(answerBubble);
        thread.scrollTop = thread.scrollHeight;
        Utils.playSuccessSound?.();
        
        // ✅ Afficher un message indiquant que les Q&A vont disparaître dans 3 secondes
        setTimeout(() => {
            const warningMsg = document.createElement('div');
            warningMsg.className = 'clearing-warning';
            warningMsg.style.cssText = 'text-align: center; padding: 0.75rem; margin-top: 1rem; background: var(--orange-soft); border-radius: 8px; color: var(--text-secondary); font-size: 0.9rem; animation: pulse 1s ease-in-out infinite;';
            warningMsg.innerHTML = '⏳ Tour suivant dans 3 secondes...';
            thread.appendChild(warningMsg);
            thread.scrollTop = thread.scrollHeight;
        }, 100);
    },

    show() {
        console.log('[Phase2] show');
        Utils.showScreen?.('questions-phase2-screen');
        this.startPhase();
    }
};

window.QuestionsPhase2Screen = QuestionsPhase2Screen;
document.addEventListener('DOMContentLoaded', () => QuestionsPhase2Screen.init());
