// src/js/realtime.js
(() => {
  'use strict';

  // -------- logging / helpers
  const DEBUG = true;
  const L = (ev, data) => DEBUG && console.log(`[SOCKET] ${ev}`, data);
  let __lastTurn = null;

  function renderBannerFromTurn(turn) {
    if (!turn) return;
    const q = window.gameState?.getPlayerById?.(turn.questionerId);
    const t = window.gameState?.getPlayerById?.(turn.targetId);
    const banner = document.getElementById('phase1-current-turn'); // ⚠️ ID unique
    if (banner && q && t) {
      banner.textContent = `Tour ${turn.index + 1}/${turn.total} : ${q.name} → ${t.name}`;
    }
  }

  // -------- contexte session
  let ctx = {};
  try { ctx = JSON.parse(sessionStorage.getItem('intrus_ctx') || '{}'); } catch (_) {}
  if (!ctx?.roomId || !ctx?.name) {
    console.warn('[realtime] intrus_ctx manquant → redirection');
    // si tu n'as pas /join, renvoie à la racine
    location.href = '/';
    return;
  }
  ctx.name = (ctx.name || '').trim();

  // -------- socket
  const socket = io();
  window.socket = socket;
  window.gameState?.setMode?.('online');

  socket.on('connect', () => {
    L('connect', { sid: socket.id, ctx });
    // optionnel si tu as ajouté setMySid
    window.gameState?.setMySid?.(socket.id);

    socket.emit('room:join', {
      roomId: ctx.roomId,
      name:   ctx.name,
      avatar: ctx.avatar,
      rejoin: true
    });
  });

  // -------- events serveur

  // setup public
  socket.on('game:setup', ({ roomId, players } = {}) => {
    try {
      L('game:setup', { roomId, players });
      window.gameState?.setRoom?.(roomId);
      window.gameState?.setPlayers?.(players);
      window.gameState?.setCurrentPlayerByName?.(ctx.name);
      // notifier les écrans qui attendent les joueurs
      document.dispatchEvent(new CustomEvent('state:players'));
    } catch (e) {
      console.error('[realtime] game:setup error', e);
    }
    // si un tour était arrivé avant, on rend maintenant
    renderBannerFromTurn(__lastTurn);
  });

  // rôle privé
  socket.on('game:role', ({ isIntruder, animal } = {}) => {
    try {
      L('game:role', { isIntruder, animal });
      window.gameState?.setMyRole?.({ isIntruder, animal });
      document.dispatchEvent(new CustomEvent('state:role'));

      // Réinitialiser l'état de la phase de questions pour une nouvelle partie
      if (window.QuestionsPhase1Screen) {
        window.QuestionsPhase1Screen.phaseStarted = false;
      }

      // Navigation vers l'écran de rôle
      if (window.intrusGame?.navigateTo) {
        intrusGame.navigateTo('role-screen');
      } else {
        window.Utils?.showScreen?.('role-screen', 'slide');
      }
      
      window.RoleAssignmentScreen?.displayRole?.();
    } catch (e) {
      console.error('[realtime] game:role error', e);
    }
  });

  // Ready check - afficher le compteur de joueurs prêts
  socket.on('ready:update', ({ ready, total } = {}) => {
    try {
      L('ready:update', { ready, total });
      
      // Mettre à jour le compteur sur l'écran de rôle
      const readyCounter = document.getElementById('ready-counter');
      if (readyCounter) {
        readyCounter.textContent = `${ready}/${total} joueurs prêts`;
        readyCounter.style.color = ready === total ? 'var(--success)' : 'var(--text-secondary)';
      }
      
      // Notification
      if (ready < total) {
        window.Utils?.showNotification?.(`${ready}/${total} joueurs prêts`, 'info');
      }
    } catch (e) {
      console.error('[realtime] ready:update error', e);
    }
  });

  // La phase démarre vraiment - naviguer et activer les contrôles
  socket.on('phase:start', () => {
    try {
      L('phase:start');
      window.Utils?.showNotification?.('Tous les joueurs sont prêts ! La partie commence !', 'success');
      
      // Déclencher l'événement pour que RoleAssignmentScreen puisse réagir
      document.dispatchEvent(new CustomEvent('phase:start'));
      
      // Naviguer vers l'écran de questions SEULEMENT si on est sur l'écran de rôle
      // et que le joueur a cliqué sur "Suivant" (géré par RoleAssignmentScreen)
      setTimeout(() => {
        if (window.intrusGame?.navigateTo) {
          intrusGame.navigateTo('questions-phase1-screen');
        } else {
          window.Utils?.showScreen?.('questions-phase1-screen', 'slide');
        }
        
        // Activer la phase de questions
        window.QuestionsPhase1Screen?.startPhase?.();
      }, 1000); // Petit délai pour que la notification soit visible
    } catch (e) {
      console.error('[realtime] phase:start error', e);
    }
  });

  // nouveau tour
  socket.on('turn:new', ({ questionerId, targetId, index = 0, total = 0 } = {}) => {
    try {
      L('turn:new', { questionerId, targetId, index, total });
      __lastTurn = { questionerId, targetId, index, total };
      renderBannerFromTurn(__lastTurn);

      window.QuestionsPhase1Screen?.onNewTurn?.({
        index: index + 1,  // UI en 1-based
        total,
        asker: questionerId,
        target: targetId
      });
    } catch (e) {
      console.error('[realtime] turn:new error', e);
    }
  });

  // question / réponse
  socket.on('question:ask', ({ from, to, text } = {}) => {
    try {
      L('question:ask', { from, to, text });
      window.QuestionsPhase1Screen?.onAsked?.({ text, asker: from, target: to });
    } catch (e) {
      console.error('[realtime] question:ask error', e);
    }
  });

  socket.on('question:answer', ({ from, to, answer } = {}) => {
    try {
      L('question:answer', { from, to, answer });
      // convention: from = cible, to = questionneur
      window.QuestionsPhase1Screen?.onAnswered?.({ answer, asker: to, target: from });
    } catch (e) {
      console.error('[realtime] question:answer error', e);
    }
  });

  // fin des tours → afficher l'écran de vote (fallback robuste)
 socket.on('turn:end', () => {
  try {
    L('turn:end');

    // Affiche l'écran de vote, mais n'active rien pour l'instant
    if (window.intrusGame?.navigateTo) {
      intrusGame.navigateTo('vote-continue-screen');
    } else {
      window.Utils?.showScreen?.('vote-continue-screen', 'slide');
    }

    // Met l'UI en attente du "vote:continue:start"
    const V = window.VoteContinueScreen;
    if (V) {
      V.ready = false;          // pas encore ouvert
      V.hasVoted = false;       // reset éventuel
      V.disableVoteButtons?.(); // bloque Oui/Non

      // Affiche 0/total en attendant le start du serveur
      const total = (window.gameState?.players || []).length || 0;
      if (typeof V.update === 'function') {
        V.update({ count: 0, total, yes: 0, no: 0 });
      } else {
        const counter = document.getElementById('vote-count');
        if (counter) counter.textContent = `0/${total}`;
      }
    }
  } catch (e) {
    console.error('[realtime] turn:end error', e);
  }
});



  // ---- VOTE CONTINUE (temps réel)
  socket.on('vote:continue:start', ({ total } = {}) => {
    L('vote:continue:start', { total });
    console.log('[realtime] vote:continue:start received, total:', total);
    console.log('[realtime] VoteContinueScreen exists?', !!window.VoteContinueScreen);
    console.log('[realtime] VoteContinueScreen.begin exists?', !!window.VoteContinueScreen?.begin);
    
    // IMPORTANT: D'abord activer le vote avec begin()
    if (window.VoteContinueScreen?.begin) {
      console.log('[realtime] Calling VoteContinueScreen.begin()');
      window.VoteContinueScreen.begin({ total });
    } else {
      console.error('[realtime] VoteContinueScreen.begin NOT FOUND!');
    }
    
    // Puis naviguer vers l'écran
    console.log('[realtime] Navigating to vote-continue-screen');
    if (window.intrusGame?.navigateTo) intrusGame.navigateTo('vote-continue-screen');
    else window.Utils?.showScreen('vote-continue-screen', 'slide');
  });

  socket.on('vote:continue:update', ({ count, total, yes, no } = {}) => {
    L('vote:continue:update', { count, total, yes, no });
    window.VoteContinueScreen?.update?.({ count, total, yes, no });
  });

  socket.on('vote:continue:end', ({ continue: cont } = {}) => {
    L('vote:continue:end', { continue: cont });
    if (cont) {
      // relance phase 1
      if (window.intrusGame?.navigateTo) intrusGame.navigateTo('questions-phase1-screen');
      else window.Utils?.showScreen('questions-phase1-screen', 'slide');
      window.QuestionsPhase1Screen?.startPhase?.();
    }
    // SINON: Ne rien faire ici, le serveur enverra phase2:start ou final_vote:start
  });

  // -------- PHASE 2 : Questions Déléguées
  socket.on('phase2:start', ({ players, totalTurns } = {}) => {
    L('phase2:start', { players, totalTurns });
    
    // Sauvegarder les joueurs dans gameState
    if (players && Array.isArray(players) && window.gameState) {
      window.gameState.players = players;
    }
    
    // Naviguer vers phase 2
    if (window.intrusGame?.navigateTo) intrusGame.navigateTo('questions-phase2-screen');
    else window.Utils?.showScreen('questions-phase2-screen', 'slide');
    window.QuestionsPhase2Screen?.startPhase?.();
  });

  socket.on('phase2:turn', ({ questionerId, availableTargets, turnIndex, totalTurns } = {}) => {
    L('phase2:turn', { questionerId, availableTargets, turnIndex, totalTurns });
    window.QuestionsPhase2Screen?.onNewTurn?.({ questionerId, availableTargets, turnIndex, totalTurns });
  });

  socket.on('phase2:asked', ({ questionerId, targetId, question } = {}) => {
    L('phase2:asked', { questionerId, targetId, question });
    window.QuestionsPhase2Screen?.onAsked?.({ questionerId, targetId, question });
  });

  socket.on('phase2:answered', ({ targetId, answer } = {}) => {
    L('phase2:answered', { targetId, answer });
    window.QuestionsPhase2Screen?.onAnswered?.({ targetId, answer });
  });

  socket.on('phase2:end', () => {
    L('phase2:end');
    window.Utils?.showNotification?.('Phase 2 terminée !', 'success');
  });


  // maj lobby
  socket.on('room:update', (players) => {
    try {
      L('room:update', players);
      window.gameState?.setPlayers?.(players);
      document.dispatchEvent(new CustomEvent('state:players'));
    } catch (e) {
      console.error('[realtime] room:update error', e);
    }
  });

  // erreurs / réseau
  socket.on('server:error', (payload) => {
    console.error('[server:error]', payload);
    if (window.Utils?.showNotification && payload?.msg) {
      window.Utils.showNotification(payload.msg, 'error');
      
      // Si c'est une erreur de pseudo déjà utilisé, permettre de réessayer
      if (payload.msg.includes('déjà utilisé') || payload.msg.includes('pseudo')) {
        // Focus sur le champ de nom après un court délai
        setTimeout(() => {
          const nameInput = document.querySelector('input[type="text"][placeholder*="pseudo" i], input[type="text"][placeholder*="nom" i]');
          if (nameInput) {
            nameInput.focus();
            nameInput.select();
          }
        }, 500);
      }
    }
  });
  socket.on('connect_error', (err) => console.error('[connect_error]', err?.message || err));
  socket.on('disconnect', (why) => console.warn('[socket] disconnected:', why));

  // -------- Vote Final
  socket.on('final_vote:start', ({ suspects } = {}) => {
    L('final_vote:start', { suspects });
    
    // CRITIQUE: Sauvegarder les suspects dans gameState
    if (suspects && Array.isArray(suspects) && window.gameState) {
      console.log('[final_vote] Reçu suspects:', suspects);
      window.gameState.players = suspects;
    }
    
    // Démarrer le vote AVANT de naviguer (pour que renderSuspects() ait les données)
    window.FinalVoteScreen?.startVote?.();
    
    // Puis naviguer
    if (window.intrusGame?.navigateTo) intrusGame.navigateTo('final-vote-screen');
    else window.Utils?.showScreen('final-vote-screen', 'slide');
  });

  socket.on('final_vote:update', ({ count, total } = {}) => {
    L('final_vote:update', { count, total });
    window.FinalVoteScreen?.updateVoteCount?.(count, total);
  });

  socket.on('final_vote:end', () => {
    L('final_vote:end');
    window.Utils?.showNotification?.('Tous les votes sont comptés !', 'success');
  });

  // -------- Gestion de la déconnexion d'un joueur
  socket.on('player:left', ({ playerName, remainingPlayers, canContinue } = {}) => {
    L('player:left', { playerName, remainingPlayers, canContinue });
    
    // Notification pour informer qu'un joueur a quitté
    const message = `${playerName} a quitté la partie. Joueurs restants : ${remainingPlayers}`;
    window.Utils?.showNotification?.(message, canContinue ? 'info' : 'error');
    
    // Si moins de 3 joueurs, bloquer le bouton "Continuer à jouer"
    if (!canContinue) {
      window.ResultsScreen?.disableContinueButton?.(`${playerName} a quitté la partie donc impossible de démarrer une autre vous êtes <3`);
    }
  });

  // -------- Interface spéciale pour l'intrus
  socket.on('intruder:guess_animal', ({ animals } = {}) => {
    L('intruder:guess_animal', { animals });
    
    // Sauvegarder les animaux dans gameState
    if (animals && Array.isArray(animals) && window.gameState) {
      window.gameState.animalChoices = animals;
    }
    
    // Naviguer vers l'écran de devinette pour l'intrus
    if (window.IntruderGuessScreen) {
      window.IntruderGuessScreen.startGuess(animals);
      if (window.intrusGame?.navigateTo) intrusGame.navigateTo('intruder-guess-screen');
      else window.Utils?.showScreen('intruder-guess-screen', 'slide');
    } else {
      console.error('[intruder] IntruderGuessScreen not found!');
    }
  });

  // -------- Résultats
  socket.on('game:results', ({ intruder, intruderCaught, intruderGuessedCorrectly, correctAnimal, votes, scores, winners, cumulativeScores, gamesPlayed } = {}) => {
    L('game:results', { intruder, intruderCaught, intruderGuessedCorrectly, correctAnimal, votes, scores, winners, cumulativeScores, gamesPlayed });
    if (window.intrusGame?.navigateTo) intrusGame.navigateTo('results-screen');
    else window.Utils?.showScreen('results-screen', 'slide');
    window.ResultsScreen?.displayResults?.({ intruder, intruderCaught, intruderGuessedCorrectly, correctAnimal, votes, scores, cumulativeScores, gamesPlayed });
  });

  // -------- "Continuer à jouer" (play again)
  socket.on('play:again:update', ({ count, total } = {}) => {
    L('play:again:update', { count, total });
    
    // Mettre à jour le compteur dans l'écran des résultats
    const counterDiv = document.getElementById('play-again-counter');
    if (counterDiv) {
      counterDiv.textContent = `${count}/${total} joueurs prêts`;
      counterDiv.style.display = 'block';
    }
    
    window.Utils?.showNotification?.(`${count}/${total} joueurs prêts à continuer`, 'info');
  });

  socket.on('play:again:confirmed', () => {
    L('play:again:confirmed');
    
    window.Utils?.showNotification?.('Nouvelle partie dans 2 secondes...', 'success');
    
    // Préparer l'interface pour la nouvelle partie
    setTimeout(() => {
      // Réinitialiser l'état si nécessaire
      if (window.ResultsScreen) {
        window.ResultsScreen.resultsData = null;
      }
      
      // Masquer l'écran actuel et afficher un écran de transition
      const playAgainBtn = document.getElementById('play-again-btn');
      if (playAgainBtn) {
        playAgainBtn.textContent = 'Chargement...';
        playAgainBtn.disabled = true;
      }
      
      // Le serveur va envoyer game:setup puis game:role qui navigueront automatiquement
    }, 1000);
  });

  // -------- API temps réel (UNIQUE, pas d'écrasement)
  window.realtime = {
    ask(text) {
      if (!text) return;
      socket.emit('question:ask', { roomId: ctx.roomId, text });
    },
    answer(value) {
      socket.emit('question:answer', { roomId: ctx.roomId, answer: value });
    },
    voteContinue(choice) { // 'yes' | 'no'
      const payload = { roomId: ctx.roomId, choice };
      console.log('[emit] vote:continue:cast', payload);
      socket.emit('vote:continue:cast', payload, (ack) => {
        console.log('[ack] vote:continue:cast', ack);
        if (!ack || ack.ok !== true) {
          const why = ack?.reason || 'inconnu';
          window.Utils?.showNotification?.(`Vote non pris en compte (${why})`, 'error');
        }
      });
    },
    askPhase2(targetId, question) {
      if (!targetId || !question) return;
      socket.emit('phase2:ask', { roomId: ctx.roomId, targetId, question }, (ack) => {
        console.log('[ack] phase2:ask', ack);
        
        if (ack && ack.ok) {
          // Succès : afficher la notification de succès et vider l'input
          window.Utils?.showNotification?.('Question envoyée !', 'success');
          window.Utils?.playSuccessSound?.();
          
          // Vider l'input seulement en cas de succès
          const questionInput = document.getElementById('delegated-question-input');
          if (questionInput) {
            questionInput.value = '';
          }
        } else if (ack && !ack.ok) {
          // Erreur : afficher le message d'erreur spécifique
          let errorMsg = 'Question non envoyée';
          if (ack.reason === 'invalid_question') {
            errorMsg = 'Question invalide (minimum 2 caractères)';
          } else if (ack.reason === 'question_too_long') {
            errorMsg = 'Question trop longue (200 caractères max)';
          } else if (ack.reason === 'question_forbidden_chars') {
            errorMsg = 'La question contient des caractères interdits';
          } else if (ack.reason === 'not_your_turn') {
            errorMsg = "Ce n'est pas votre tour";
          } else if (ack.reason === 'invalid_target') {
            errorMsg = 'Cible invalide';
          } else if (ack.reason === 'cannot_ask_yourself') {
            errorMsg = 'Vous ne pouvez pas vous poser une question';
          } else if (ack.reason === 'cannot_target_previous_questioner') {
            errorMsg = 'Vous ne pouvez pas cibler le questionneur précédent';
          }
          window.Utils?.showNotification?.(errorMsg, 'error');
          window.Utils?.playErrorSound?.();
          
          // Réactiver l'input en cas d'erreur (sans vider la question pour que l'utilisateur puisse la modifier)
          if (window.QuestionsPhase2Screen?.enableQuestionInput) {
            window.QuestionsPhase2Screen.enableQuestionInput();
          }
        }
      });
    },
    answerPhase2(answer) {
      if (!answer) return;
      socket.emit('phase2:answer', { roomId: ctx.roomId, answer }, (ack) => {
        console.log('[ack] phase2:answer', ack);
        if (!ack || !ack.ok) {
          window.Utils?.showNotification?.('Réponse non envoyée', 'error');
        }
      });
    },
    voteFinal(suspectId) {
      socket.emit('final_vote:cast', { roomId: ctx.roomId, suspectId });
    },
    submitIntruderGuess(animal) {
      socket.emit('intruder:submit_guess', { roomId: ctx.roomId, animal }, (ack) => {
        console.log('[ack] intruder:submit_guess', ack);
        if (!ack || !ack.ok) {
          window.Utils?.showNotification?.('Réponse non envoyée', 'error');
        } else {
          window.Utils?.showNotification?.('Réponse envoyée !', 'success');
        }
      });
    }
  };

// Fallback sûr à la fin des tours


  // alias compat
  window.NET = window.NET || window.realtime;

  // debug
  window.intrusCtx = ctx;
})();
