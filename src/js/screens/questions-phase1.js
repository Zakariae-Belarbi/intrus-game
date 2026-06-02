// src/js/screens/questions-phase1.js
(() => {
  'use strict';

  const $id = (id) => document.getElementById(id);
  const $ = (sel, root = document) => root.querySelector(sel);

  // petit fallback si Utils.createElement n'existe pas
  function makeEl(tag, className = '') {
    if (window.Utils?.createElement) return Utils.createElement(tag, className);
    const el = document.createElement(tag);
    if (className) el.className = className;
    return el;
  }

  const QuestionsPhase1Screen = {
    _bound: false,
    phaseStarted: false,  // La phase a-t-elle vraiment démarré ?

    // État du tour en cours
    turn: {
      index: 0,     // 1-based
      total: 0,
      asker: null,  // SID
      target: null, // SID
    },

    init() {
      if (this._bound) return;
      this._bound = true;

      const sendBtn = $id('send-question-btn');
      const qInput  = $id('question-input');
      const nextBtn = $id('phase1-next-btn');

      // Envoyer (questionneur uniquement)
      sendBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        this.sendQuestion();
      });

      // Enter -> envoyer si c'est moi le questionneur
      qInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.sendQuestion();
        }
      });

      // Compat : bouton "phase suivante" (non utilisé en online)
      nextBtn?.addEventListener('click', () => this.proceedToVote());

      // État neutre au départ
      this.resetUI();
      this.updateControls();
    },

    // Appelée éventuellement par RoleAssignment ou directement par realtime
    startPhase() {
      this.init();
      const root = $id('questions-phase1-screen');
      root && root.classList.remove('hidden');
      this.resetUI();
      
      // Activer les contrôles maintenant que la phase démarre vraiment
      this.phaseStarted = true;
      this.updateControls();
    },

    // ========== Événements poussés par realtime.js ==========

    // Nouveau tour
    onNewTurn({ index, total, asker, target }) {
      this.init();
      this.turn.index  = Number(index) || 1;  // index est déjà 1-based depuis realtime.js
      this.turn.total  = Number(total) || 0;
      this.turn.asker  = asker;
      this.turn.target = target;

      console.log('[PHASE1] turn:new', this.turn);

      // UI header
      this.updateTurnBanner();
      this.updateProgressBar();

      // réinitialiser la zone de réponse + thread
      const ansBox = $id('answer-section');
      if (ansBox) ansBox.innerHTML = `<div class="waiting-message">${Utils.escapeHTML(t('phase1.waiting_question'))}</div>`;
      const thread = $id('questions-thread');
      if (thread) {
        // ✅ NETTOYER l'historique des questions/réponses pour chaque nouveau tour
        thread.innerHTML = '';
      }

      // activer/désactiver les contrôles localement
      this.updateControls(true);

      // petite anim du bandeau
      const banner = $('.banner');
      if (banner) {
        banner.style.transform = 'translateY(-10px)';
        banner.style.opacity = '0.8';
        setTimeout(() => {
          banner.style.transform = 'translateY(0)';
          banner.style.opacity = '1';
          Utils?.playClickSound?.();
        }, 140);
      }
    },

    // Question posée (broadcast serveur)
    onAsked({ text, asker, target }) {
      const safeText = Utils?.escapeHTML ? Utils.escapeHTML(text) : String(text || '');
      const safeAsker = this._safeNameOf(asker);
      const safeTarget = this._safeNameOf(target);
      const thread = $id('questions-thread');
      if (thread) {
        const bubble = makeEl('div', 'question-bubble slide-in-left');
        bubble.innerHTML = `
          <div class="bubble-author">${safeAsker} → ${safeTarget}</div>
          <div class="bubble-content">${safeText}</div>
        `;
        thread.appendChild(bubble);
        thread.scrollTop = thread.scrollHeight;
        Utils?.fadeIn?.(bubble, 100);
      }

      // Si je suis la cible -> montrer Oui / Non
      if (window.socket?.id === target) {
        const ansBox = $id('answer-section');
        if (ansBox) {
          ansBox.innerHTML = `
            <div class="answer-prompt">
              <h4>${Utils.escapeHTML(t('phase1.answer'))}</h4>
              <p class="question-repeat">"${safeText}"</p>
            </div>
            <div class="answer-buttons">
              <button class="answer-btn yes" id="ans-yes">✓ ${Utils.escapeHTML(t('phase1.yes'))}</button>
              <button class="answer-btn no"  id="ans-no">✗ ${Utils.escapeHTML(t('phase1.no'))}</button>
            </div>
          `;
          Utils?.slideUp?.(ansBox);
        }
        const yes = $id('ans-yes');
        const no  = $id('ans-no');
        yes && (yes.onclick = () => this.submitAnswer('yes'));
        no  && (no.onclick  = () => this.submitAnswer('no'));
      } else {
        // Sinon, indiquer visuellement qu'on attend la réponse de la cible
        const ansBox = $id('answer-section');
        if (ansBox) {
          ansBox.innerHTML = `<div class="waiting-message">${Utils.escapeHTML(t('phase1.waiting_answer', { name: this._nameOf(target) }))}</div>`;
        }
      }

      // Interdire à l'asker de renvoyer une 2e question
      if (window.socket?.id === asker) {
        const qInput = $id('question-input');
        const send   = $id('send-question-btn');
        if (qInput) qInput.disabled = true;
        if (send)   send.disabled = true;
      }
    },

    // Réponse (broadcast serveur)
    onAnswered({ answer, asker, target }) {
      const ansBox = $id('answer-section');
      if (ansBox) {
        ansBox.innerHTML = `<div class="result">${Utils.escapeHTML(t('phase1.response'))} <b>${/yes|oui/i.test(answer) ? Utils.escapeHTML(t('phase1.yes')) : Utils.escapeHTML(t('phase1.no'))}</b></div>`;
      }

      const thread = $id('questions-thread');
      if (thread) {
        const bubble = makeEl('div', 'answer-bubble slide-in-right');
        bubble.innerHTML = `
          <div class="bubble-author">${this._safeNameOf(target)}</div>
          <div class="bubble-content"><strong>${/yes|oui/i.test(answer) ? Utils.escapeHTML(t('phase1.yes')) : Utils.escapeHTML(t('phase1.no'))}</strong></div>
        `;
        thread.appendChild(bubble);
        thread.scrollTop = thread.scrollHeight;
        Utils?.fadeIn?.(bubble, 100);
        
        // ✅ Afficher un message indiquant que les Q&A vont disparaître dans 3 secondes
        setTimeout(() => {
          const warningMsg = makeEl('div', 'clearing-warning');
          warningMsg.style.cssText = 'text-align: center; padding: 0.75rem; margin-top: 1rem; background: var(--orange-soft); border-radius: 8px; color: var(--text-secondary); font-size: 0.9rem; animation: pulse 1s ease-in-out infinite;';
          warningMsg.innerHTML = Utils.escapeHTML(t('phase1.next_turn'));
          thread.appendChild(warningMsg);
          thread.scrollTop = thread.scrollHeight;
        }, 100);
      }

      // Le serveur enchaîne le prochain tour tout seul → on attend le prochain turn:new
      this.disableInputsOnly();
    },

    // ========== Actions locales ==========

    sendQuestion() {
      const qInput = $id('question-input');
      const send   = $id('send-question-btn');
      const text   = (qInput?.value || '').trim();

      if (!text) {
        Utils?.showNotification?.(t('phase1.enter_question'), 'error');
        Utils?.playErrorSound?.();
        Utils?.wiggle?.(qInput);
        return;
      }

      // sécurité : seul le questionneur peut envoyer
      if (window.socket?.id !== this.turn.asker) {
        console.warn('[PHASE1] tentative d’envoi alors que je ne suis pas le questionneur');
        Utils?.showNotification?.(t('phase1.not_your_turn'), 'error');
        return;
      }

      if (text.length > 200) {
        Utils?.showNotification?.(t('phase1.question_too_long_200'), 'error');
        Utils?.playErrorSound?.();
        return;
      }

      if (Utils?.hasHTMLChars?.(text)) {
        Utils?.showNotification?.(t('phase1.question_invalid'), 'error');
        Utils?.playErrorSound?.();
        return;
      }

      // Envoi au serveur (il re-broadcaste question:ask à tout le monde)
      window.NET?.ask?.(text);

      // Désactiver localement jusqu'à la réponse
      if (qInput) qInput.value = '';
      if (send)   send.disabled = true;

      Utils?.showNotification?.(t('phase1.question_sent'), 'success');
      Utils?.playSuccessSound?.();
    },

    submitAnswer(ans) {
      // sécurité : seule la cible peut répondre
      if (window.socket?.id !== this.turn.target) {
        console.warn('[PHASE1] tentative de réponse alors que je ne suis pas la cible');
        return;
      }
      window.NET?.answer?.(ans);
      this.disableInputsOnly();
    },

    // ========== UI helpers ==========

    updateTurnBanner() {
      const banner = $id('phase1-current-turn');
      const idx = Math.max(1, Number(this.turn.index) || 1);
      const total = Number(this.turn.total) || 0;
      const askerName  = this._nameOf(this.turn.asker);
      const targetName = this._nameOf(this.turn.target);
      if (banner) banner.textContent = t('phase1.current_turn', { index: idx, total, asker: askerName, target: targetName });
    },

    updateProgressBar() {
      const bar = $id('phase1-progress');
      if (!bar) return;
      const pct = (this.turn.total ? (this.turn.index / this.turn.total) : 0) * 100;
      bar.style.width = `${Math.max(0, Math.min(100, pct))}%`;
    },

    updateControls(clearInput = false) {
      const qInput = $id('question-input');
      const send   = $id('send-question-btn');
      const meIsAsker  = window.socket?.id === this.turn.asker;
      const meIsTarget = window.socket?.id === this.turn.target;

      if (qInput) {
        qInput.disabled = !meIsAsker;
        qInput.placeholder = meIsAsker ? t('phase1.question_placeholder') : t('phase1.waiting_placeholder');
        if (clearInput) qInput.value = '';
      }
      if (send) send.disabled = !meIsAsker;

      // La zone de réponse est créée dynamiquement dans onAsked(),
      // donc ici on ne gère que la désactivation globale des boutons potentiels
      if (!meIsTarget) {
        const yes = $id('ans-yes');
        const no  = $id('ans-no');
        if (yes) yes.disabled = true;
        if (no)  no.disabled = true;
      }
    },

    disableInputsOnly() {
      const qInput = $id('question-input');
      const send   = $id('send-question-btn');
      if (qInput) qInput.disabled = true;
      if (send)   send.disabled = true;
      const yes = $id('ans-yes');
      const no  = $id('ans-no');
      if (yes) yes.disabled = true;
      if (no)  no.disabled = true;
    },

    resetUI() {
      const qInput = $id('question-input');
      const send   = $id('send-question-btn');
      qInput && (qInput.value = '');
      send   && (send.disabled = true);

      const banner = $id('current-turn');
      banner && (banner.textContent = t('phase1.default_turn'));

      const bar = $id('phase1-progress');
      bar && (bar.style.width = '0%');

      const thread = $id('questions-thread');
      thread && (thread.innerHTML = '');

      const ans = $id('answer-section');
      ans && (ans.innerHTML = `<div class="waiting-message">${Utils.escapeHTML(t('phase1.waiting_question'))}</div>`);
    },

    // Compat / fallback (si quelqu’un clique quand même)
    proceedToVote() {
      Utils?.showNotification?.(t('phase1.vote_in_progress'), 'info');
      Utils?.playClickSound?.();
      setTimeout(() => {
        if (window.intrusGame?.navigateTo) intrusGame.navigateTo('vote-continue-screen');
        else Utils?.showScreen?.('vote-continue-screen', 'slide');
        window.VoteContinueScreen?.startVote?.();
      }, 600);
    },

    _nameOf(sid) {
      const p = window.gameState?.players?.find(p => p.id === sid);
      return p?.name || 'Joueur';
    },

    _safeNameOf(sid) {
      return Utils?.escapeHTML ? Utils.escapeHTML(this._nameOf(sid)) : this._nameOf(sid);
    },

    show() {
      Utils?.showScreen?.('questions-phase1-screen');
      this.startPhase();
    }
  };

  // Expose global
  window.QuestionsPhase1Screen = QuestionsPhase1Screen;

  // Auto-init
  document.addEventListener('DOMContentLoaded', () => QuestionsPhase1Screen.init());
})();
