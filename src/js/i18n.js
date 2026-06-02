const translations = {
  fr: {
    // Language selection
    "language.title": "Choisir la langue",
    "language.subtitle": "Choisis la langue que tu veux utiliser pendant ta partie",
    "language.fr": "Français",
    "language.darija": "Darija",
    "language.continue": "Continuer",

    // Home
    "home.page_title": "Intrus Game - Trouvez l'intrus !",
    "home.title": "Intrus Game",
    "home.subtitle": "Découvrez qui se cache parmi vous",
    "home.description": "Un jeu de déduction sociale captivant pour 3 à 8 joueurs",
    "home.create_room": "Créer une salle",
    "home.create_room_desc": "Lancez une nouvelle partie et invitez vos amis à vous rejoindre",
    "home.custom_games": "Parties personnalisées",
    "home.join_room": "Rejoindre une salle",
    "home.join_room_desc": "Entrez le code de la salle pour participer à une partie en cours",
    "home.quick_connection": "Connexion rapide",
    "home.join": "Rejoindre",
    "home.how_to_play": "Comment jouer",
    "home.how_to_play_desc": "Nouveau joueur ? Découvrez les règles du jeu en 2 minutes",

    // Create room page
    "create.page_title": "Salle créée - Intrus Game",
    "create.title": "Salle créée !",
    "create.room_id": "ID de la salle",
    "create.copy": "Copier",
    "create.pseudo_placeholder": "Votre pseudo",
    "create.add": "Ajouter",
    "create.players_in_room": "Joueurs dans la salle",
    "create.starting": "Démarrer...",
    "create.start_game": "Démarrer la partie !",
    "create.room_created_success": "Salle créée avec succès !",
    "create.room_create_error": "Impossible de créer la salle. Réessaie.",
    "create.id_copied": "ID copié dans le presse-papier !",
    "create.enter_pseudo": "Veuillez entrer un pseudo avant de continuer !",
    "create.pseudo_min": "Le pseudo doit contenir au moins 2 caractères !",
    "create.more_players": "Encore {count} joueur(s)...",

    // Join room page
    "join.page_title": "Intrus Game - Rejoindre une salle",
    "join.title": "Rejoindre une salle",
    "join.enter_room_id": "Entrez l'ID de la salle",
    "join.room_id_placeholder": "ROOM-XXXX",
    "join.verify": "Vérifier",
    "join.verifying": "Vérification...",
    "join.invalid_room": "ID invalide ou salle non trouvée",
    "join.room_found": "Salle trouvée !",
    "join.pseudo_placeholder": "Ton pseudo",
    "join.players_in_room": "Joueurs dans la salle",
    "join.waiting": "Attente...",
    "join.waiting_for_players": "En attente de {count} joueur(s)...",
    "join.starting_soon": "Démarrage imminent",
    "join.id_copied": "ID copié dans le presse-papiers !",
    "join.enter_pseudo": "Veuillez entrer un pseudo avant de rejoindre !",
    "join.pseudo_min": "Le pseudo doit contenir au moins 2 caractères !",
    "join.enter_valid_code": "Veuillez entrer un code de salle valide (ROOM-XXXX) !",
    "join.game_already_started": "La partie a déjà démarré, impossible de rejoindre.",

    // Lobby / room
    "room.created": "Salle créée",
    "room.found": "Salle trouvée",
    "room.full": "Salle pleine",
    "room.not_found": "Salle introuvable",
    "room.invalid_id": "Code invalide",
    "room.game_started": "La partie a déjà commencé",
    "room.joined": "Rejoint la salle {roomId}",
    "room.join_error": "Impossible de rejoindre cette salle",
    "room.id_invalid_format": "ID de salle invalide. Format: XXXXX-1234",
    "room.copy_error": "Erreur lors de la copie",
    "room.name_required": "Veuillez entrer un pseudo",
    "room.name_too_short": "Le pseudo doit contenir au moins 2 caractères",
    "room.name_invalid": "Le nom doit contenir 2-20 caractères",
    "room.name_taken": "Le pseudo est déjà utilisé",
    "room.name_taken_full": "Le pseudo \"{name}\" est déjà utilisé. Choisissez-en un autre.",
    "room.player_joined": "{name} a rejoint la partie !",
    "room.player_removed": "Joueur retiré",
    "room.max_players": "Nombre maximum de joueurs atteint",
    "room.min_players": "Il faut au moins 3 joueurs pour commencer",
    "room.min_players_required": "Au moins 3 joueurs requis",
    "room.game_starting": "La partie commence !",
    "room.only_host": "Seul l'hôte peut démarrer.",
    "room.wait_all_ready": "Attendez que tous les joueurs soient prêts",

    // Game global
    "game.page_title": "Intrus Game - Partie",
    "game.player": "Joueur",
    "game.unknown_player": "Un joueur",
    "game.next": "Suivant",
    "game.loading": "Chargement...",
    "game.waiting": "En attente...",
    "game.continue": "Continuer",
    "game.back": "Retour",
    "game.back_to_room": "Retour à la salle",
    "game.back_to_lobby": "Retour au lobby",
    "game.quit_confirm": "Êtes-vous sûr de vouloir quitter ?",
    "game.quit_room_confirm": "Retourner au lobby ?",
    "game.player_left": "Un joueur a quitté la partie",
    "game.player_left_name": "{name} a quitté la partie. Joueurs restants : {count}",
    "game.cannot_continue": "Impossible de continuer",
    "game.cannot_continue_players": "{name} a quitté la partie donc impossible de démarrer une autre partie",
    "game.disconnected": "Déconnexion",
    "game.reconnect_error": "Impossible de recoller: joueur inconnu",

    // Role screen
    "role.title": "Découvrez votre rôle",
    "role.preparing": "Préparation en cours...",
    "role.assigning": "Attribution des rôles...",
    "role.intruder_title": "Vous êtes L'INTRUS !",
    "role.not_intruder_title": "Vous N'ÊTES PAS l'intrus !",
    "role.your_mission": "Votre mission :",
    "role.intruder_mission_1": "Devinez l'animal secret sans vous faire découvrir !",
    "role.intruder_mission_2": "Posez des questions subtiles pour découvrir l'animal secret.",
    "role.intruder_mission_3": "Évitez d'être suspecté par les autres joueurs.",
    "role.secret_animal_unknown": "Animal secret : À DÉCOUVRIR",
    "role.normal_mission_1": "Découvrez qui est l'intrus parmi vous !",
    "role.normal_mission_2": "Utilisez l'animal secret pour poser des questions piège.",
    "role.normal_mission_3": "Observez les réactions et réponses des autres.",
    "role.secret_animal_is": "L'animal secret est : {animal}",
    "role.waiting_others": "En attente des autres joueurs...",
    "role.ready_counter": "{ready}/{total} joueurs prêts",
    "role.all_ready": "Tous les joueurs sont prêts ! La partie commence !",

    // Phase 1 questions
    "phase1.title": "Tour 1",
    "phase1.current_turn": "Tour {index} / {total} : {asker} → {target}",
    "phase1.default_turn": "Tour : -",
    "phase1.question_placeholder": "Pose ta question...",
    "phase1.waiting_placeholder": "En attente...",
    "phase1.send": "Envoyer",
    "phase1.waiting_question": "En attente de question...",
    "phase1.answer": "Répondez :",
    "phase1.waiting_answer": "En attente de la réponse de {name}...",
    "phase1.response": "Réponse :",
    "phase1.yes": "Oui",
    "phase1.no": "Non",
    "phase1.next_turn": "Tour suivant dans 3 secondes...",
    "phase1.enter_question": "Veuillez saisir une question",
    "phase1.not_your_turn": "Ce n'est pas votre tour de poser",
    "phase1.question_too_long": "Question trop longue",
    "phase1.question_too_long_200": "Question trop longue (200 caractères max)",
    "phase1.question_sent": "Question envoyée !",
    "phase1.question_not_sent": "Question non envoyée",
    "phase1.question_invalid": "Question invalide",
    "phase1.question_invalid_min": "Question invalide (minimum 2 caractères)",
    "phase1.cannot_ask_self": "Vous ne pouvez pas vous poser une question",
    "phase1.cannot_target_previous": "Vous ne pouvez pas cibler le questionneur précédent",
    "phase1.vote_in_progress": "Vote en cours...",
    "phase1.next_phase": "Phase suivante",

    // Continue vote
    "continue_vote.title": "On passe au vote ?",
    "continue_vote.description": "Votez oui pour passer au vote final et non pour passer à la deuxième phase de questions",
    "continue_vote.yes": "Oui",
    "continue_vote.no": "Non",
    "continue_vote.voters": "votants",
    "continue_vote.not_open": "Le vote n'est pas encore ouvert",
    "continue_vote.already_voted": "Vous avez déjà voté !",
    "continue_vote.your_vote": "Votre vote : {vote}",
    "continue_vote.vote_yes": "Oui",
    "continue_vote.vote_no": "Non",
    "continue_vote.vote_not_counted": "Vote non pris en compte ({why})",

    // Phase 2 questions
    "phase2.title": "Phase 2 : Questions déléguées",
    "phase2.finished": "Phase 2 terminée !",
    "phase2.turn": "Tour",
    "phase2.questioner": "Questionneur :",
    "phase2.choose_target": "Choisir la cible :",
    "phase2.select_player": "Sélectionner un joueur",
    "phase2.ask": "Poser",
    "phase2.finish_phase": "Terminer cette phase",
    "phase2.your_turn": "À vous de poser une question !",
    "phase2.someone_asks": "{name} pose une question...",
    "phase2.answer_question": "Répondez à la question !",
    "phase2.target_becomes_questioner": "{name} devient le questionneur",
    "phase2.enter_question": "Veuillez saisir une question",
    "phase2.enter_question_min": "Veuillez saisir une question (minimum 2 caractères)",
    "phase2.select_target": "Veuillez sélectionner une cible",
    "phase2.your_answer": "Votre réponse :",
    "phase2.answered": "{name} répond :",

    // Final vote
    "final_vote.title": "Qui est l'intrus ?",
    "final_vote.description": "Votez pour le joueur que vous soupçonnez",
    "final_vote.submit": "Valider mon vote",
    "final_vote.no_suspect": "Aucun suspect disponible",
    "final_vote.already_voted": "Vous avez déjà voté !",
    "final_vote.selected": "{name} sélectionné",
    "final_vote.select_suspect": "Veuillez sélectionner un suspect",
    "final_vote.confirmed": "Vote confirmé : {name}",
    "final_vote.votes_received": "{count}/{total} votes reçus",
    "final_vote.all_counted": "Tous les votes sont comptés !",

    // Intruder guess
    "intruder_guess.title": "Vous êtes l'intrus !",
    "intruder_guess.description": "Devinez l'animal pour gagner 3 points",
    "intruder_guess.find_animal": "Trouvez le bon animal pour gagner !",
    "intruder_guess.submit": "Valider mon choix",
    "intruder_guess.already_submitted": "Vous avez déjà validé votre choix !",
    "intruder_guess.already_validated": "Vous avez déjà validé !",
    "intruder_guess.selected": "{animal} sélectionné",
    "intruder_guess.select_animal": "Veuillez sélectionner un animal",
    "intruder_guess.confirmed": "Réponse confirmée : {animal}",

    // Results
    "results.title": "Résultats",
    "results.intruder_was": "L'intrus était",
    "results.unknown": "Inconnu",
    "results.final_scores": "Scores finaux",
    "results.continue_playing": "Continuer à jouer",
    "results.play_again": "Continuer à jouer",
    "results.back_to_lobby": "Retour au lobby",
    "results.intruder_found_animal": "L'intrus a trouvé l'animal : {animal}",
    "results.intruder_not_found_animal": "L'intrus n'a pas trouvé l'animal",
    "results.animal_was": "L'animal était : {animal}",
    "results.first_game": "Première partie",
    "results.game_number": "Partie {number}",
    "results.intruder_victorious": "Intrus victorieux",
    "results.intruder_discovered": "Intrus découvert",
    "results.winner": "Vainqueur",
    "results.points": "{points} pts",
    "results.points_this_game": "+{points} pts cette partie",
    "results.points_total": "{points} pts au total",
    "results.cannot_replay": "Impossible de rejouer",
    "results.waiting": "En attente...",
    "results.vote_saved_waiting": "Vote enregistré. En attente des autres joueurs...",
    "results.back_lobby": "Retour au lobby...",
    "results.new_game_soon": "Nouvelle partie dans 2 secondes...",
    "results.cannot_continue": "Impossible de continuer",

    // Tutorial
    "tutorial.title": "Bienvenue dans Intrus Game !",
    "tutorial.subtitle": "Découvrez comment jouer en quelques étapes simples",
    "tutorial.step1_title": "1. Créez ou rejoignez une salle",
    "tutorial.step1_text": "Minimum 3 joueurs requis. Un joueur crée la salle et partage le code aux autres.",
    "tutorial.step2_title": "2. Découvrez votre rôle",
    "tutorial.step2_text": "Chaque joueur reçoit un animal. Un joueur est secrètement l'intrus avec un animal différent !",
    "tutorial.step3_title": "3. Posez des questions",
    "tutorial.step3_text": "En 2 phases, posez des questions Oui/Non pour identifier l'intrus. Soyez stratégique dans vos questions !",
    "tutorial.step4_title": "4. Votez pour l'intrus",
    "tutorial.step4_text": "Après les questions, votez pour qui vous pensez être l'intrus. Points bonus si vous trouvez correctement !",
    "tutorial.start": "Commencer à jouer !",

    // Help
    "help.title": "Comment jouer à Intrus Game",
    "help.rules_title": "Règles du jeu :",
    "help.rule1": "Un joueur est secrètement désigné comme l'intrus",
    "help.rule2": "Les autres joueurs doivent trouver qui est l'intrus",
    "help.rule3": "Posez des questions pour repérer les réponses bizarres",
    "help.rule4": "Votez à la fin pour désigner l'intrus",
    "help.close": "Fermer"
  },

  darija: {
    // Language selection
    "language.title": "Khtar l logha",
    "language.subtitle": "Khtar logha li bghiti tl3b biha",
    "language.fr": "Français",
    "language.darija": "Darija",
    "language.continue": "Kml",

    // Home
    "home.page_title": "Intrus Game - 7awl tl9a l'intrus !",
    "home.title": "Intrus Game",
    "home.subtitle": "7awl tl9a l'intrus",
    "home.description": "game bach tl9a l'intrus :)",
    "home.create_room": "Créer salle",
    "home.create_room_desc": "3yet ls7abk bach nbdaw",
    "home.custom_games": "Parties personnalisées",
    "home.join_room": "dkhl l salle",
    "home.join_room_desc": "dkhl l code dial la salle",
    "home.quick_connection": "Connexion rapide",
    "home.join": "Dkhol",
    "home.how_to_play": "kifach tl3b",
    "home.how_to_play_desc": "ila mazal ma3rftich, chof kifach tl3b",

    // Create room page
    "create.page_title": "Salle créée - Intrus Game",
    "create.title": "Salle créée !",
    "create.room_id": "Code dial la salle",
    "create.copy": "Copier",
    "create.pseudo_placeholder": "dkhel smytk",
    "create.add": "Ajouter",
    "create.players_in_room": "joueurs f la salle",
    "create.starting": "bdina...",
    "create.start_game": "bda l game",
    "create.room_created_success": "salle tsaybat",
    "create.room_create_error": "maymknch ncreew la salle, 3awed",
    "create.id_copied": "Code tcopya, sift lihom",
    "create.enter_pseudo": "dkhel smytk",
    "create.pseudo_min": "smytk khasha au moins 2 caractères",
    "create.more_players": "mazal khass {count} joueur(s)...",

    // Join room page
    "join.page_title": "Intrus Game - dkhl l salle",
    "join.title": "dkhl l salle",
    "join.enter_room_id": "dkhl l code dial la salle",
    "join.room_id_placeholder": "ROOM-XXXX",
    "join.verify": "Vérifier",
    "join.verifying": "kanvérifiw...",
    "join.invalid_room": "code machi howa hada",
    "join.room_found": "l9ina la salle :)",
    "join.pseudo_placeholder": "dkhel smytk",
    "join.players_in_room": "joueurs f la salle",
    "join.waiting": "tsna...",
    "join.waiting_for_players": "tsna {count} joueur(s)...",
    "join.starting_soon": "ghadi nbdaw",
    "join.id_copied": "Code tcopya, sift lihom",
    "join.enter_pseudo": "dkhel smytk",
    "join.pseudo_min": "smytk khasha au moins 2 caractères",
    "join.enter_valid_code": "dkhl code s7i7 dial la salle",
    "join.game_already_started": "l game deja bdat, maymknch dkhl daba",

    // Lobby / room
    "room.created": "bdina",
    "room.found": "l9ina la salle :)",
    "room.full": "salle 3amra",
    "room.not_found": "mal9inach had salle",
    "room.invalid_id": "code machi howa hada",
    "room.game_started": "l game deja bdat",
    "room.joined": "dkhlti l salle {roomId}",
    "room.join_error": "maymknch dkhl l had salle",
    "room.id_invalid_format": "code dial la salle machi s7i7",
    "room.copy_error": "code matcopyach",
    "room.name_required": "dkhel smytk",
    "room.name_too_short": "smytk khasha au moins 2 caractères",
    "room.name_invalid": "smiya khasha tkon bin 2 w 20 caractères",
    "room.name_taken": "oups, deja kayna had smia",
    "room.name_taken_full": "oups, deja kayna had smia",
    "room.player_joined": "{name} dkhl l game",
    "room.player_removed": "joueur t7yd",
    "room.max_players": "salle 3amra",
    "room.min_players": "khass au min 3 bach tbdaw l game",
    "room.min_players_required": "khass au min 3 joueurs",
    "room.game_starting": "l game bdat",
    "room.only_host": "ghir li cree la salle li y9dr ybda",
    "room.wait_all_ready": "tsna lakhrin ywjdo",

    // Game global
    "game.page_title": "Intrus Game - Partie",
    "game.player": "joueur",
    "game.unknown_player": "chi joueur",
    "game.next": "Suivant",
    "game.loading": "chargement...",
    "game.waiting": "tsna...",
    "game.continue": "kml",
    "game.back": "rje3",
    "game.back_to_room": "rje3 l salle",
    "game.back_to_lobby": "rje3 l salle",
    "game.quit_confirm": "mt2kd atkhrj ?",
    "game.quit_room_confirm": "mt2kd atkhrj ?",
    "game.player_left": "wa7d fikum khrj mn lgame",
    "game.player_left_name": "{name} khrj mn lgame. b9aw {count} joueurs",
    "game.cannot_continue": "maymknch tkmlou",
    "game.cannot_continue_players": "{name} khrj mn lgame, maymknch tbdaw game okhra",
    "game.disconnected": "t9te3 connexion",
    "game.reconnect_error": "maymknch trj3, joueur machi m3rof",

    // Role screen
    "role.title": "chof role dialk",
    "role.preparing": "kanwjdou...",
    "role.assigning": "kanwz3o roles...",
    "role.intruder_title": "nta l'intrus, matfrchhach HHH",
    "role.not_intruder_title": "machi nta l'intrus",
    "role.your_mission": "mission dialk :",
    "role.intruder_mission_1": "7awl tl9a l animal bla may3i9o bik",
    "role.intruder_mission_2": "swel as2ila bach tl9a l animal",
    "role.intruder_mission_3": "matban.ch mchkok bzaf",
    "role.secret_animal_unknown": "l animal : khassek tl9ah",
    "role.normal_mission_1": "7awl tl9a chkoun l'intrus",
    "role.normal_mission_2": "st3ml l animal bach tswel as2ila",
    "role.normal_mission_3": "chof jawabat dial lakhrin mzyan",
    "role.secret_animal_is": "l animal dialkom howa : {animal}",
    "role.waiting_others": "tsna lakhrin",
    "role.ready_counter": "{ready}/{total} joueurs wajdin",
    "role.all_ready": "kolchi wajd, l game bdat",

    // Phase 1 questions
    "phase1.title": "Tour 1",
    "phase1.current_turn": "Tour {index} / {total} : {asker} → {target}",
    "phase1.default_turn": "Tour : -",
    "phase1.question_placeholder": "swel chi so2al...",
    "phase1.waiting_placeholder": "tsna...",
    "phase1.send": "Sift",
    "phase1.waiting_question": "tsna so2al...",
    "phase1.answer": "Jawb :",
    "phase1.waiting_answer": "tsna jawab dial {name}...",
    "phase1.response": "Jawab :",
    "phase1.yes": "oui",
    "phase1.no": "non",
    "phase1.next_turn": "tour jay f 3 secondes...",
    "phase1.enter_question": "ktb chi so2al",
    "phase1.not_your_turn": "machi noba dialk tswel",
    "phase1.question_too_long": "9witi katb jarida, n9es n9es",
    "phase1.question_too_long_200": "9witi katb jarida, n9es n9es",
    "phase1.question_sent": "So2al tssift, nadii",
    "phase1.question_not_sent": "so2al matsiftch",
    "phase1.question_invalid": "so2al machi s7i7",
    "phase1.question_invalid_min": "ktb chi so2al fih au moins 2 caractères",
    "phase1.cannot_ask_self": "maymknch tswel rask",
    "phase1.cannot_target_previous": "maymknch tkhtar questionneur li fat",
    "phase1.vote_in_progress": "Vote en cours",
    "phase1.next_phase": "phase jaya",

    // Continue vote
    "continue_vote.title": "Nvotew wla nkmlou had lfilm ?",
    "continue_vote.description": "Ah = nmchiw lvote final, la = nkmlou",
    "continue_vote.yes": "ysser HHH",
    "continue_vote.no": "la mazal",
    "continue_vote.voters": "votants",
    "continue_vote.not_open": "vote mazal mabdach",
    "continue_vote.already_voted": "rah deja votiti",
    "continue_vote.your_vote": "vote dialk : {vote}",
    "continue_vote.vote_yes": "ysser HHH",
    "continue_vote.vote_no": "la mazal",
    "continue_vote.vote_not_counted": "vote matsjelch ({why})",

    // Phase 2 questions
    "phase2.title": "Phase 2 : as2ila okhrin",
    "phase2.finished": "phase 2 salat",
    "phase2.turn": "Tour",
    "phase2.questioner": "li ghadi yswel :",
    "phase2.choose_target": "khtar chkoun tswel :",
    "phase2.select_player": "khtar chi wa7d",
    "phase2.ask": "Sift",
    "phase2.finish_phase": "sali had phase",
    "phase2.your_turn": "noba dialk tswel",
    "phase2.someone_asks": "{name} ghadi yswel...",
    "phase2.answer_question": "Jawb 3la so2al",
    "phase2.target_becomes_questioner": "{name} wla howa li ghadi yswel",
    "phase2.enter_question": "ktb chi so2al",
    "phase2.enter_question_min": "ktb chi so2al fih au moins 2 caractères",
    "phase2.select_target": "khtar chi wa7d",
    "phase2.your_answer": "jawab dialk :",
    "phase2.answered": "{name} jawb :",

    // Final vote
    "final_vote.title": "chkoun l'intrus ?",
    "final_vote.description": "Vote 3la li kayban lik fih chk",
    "final_vote.submit": "valider vote",
    "final_vote.no_suspect": "makayn 7ta suspect",
    "final_vote.already_voted": "rah deja votiti",
    "final_vote.selected": "{name} tkhtar",
    "final_vote.select_suspect": "ra bayn chkoun, khtar",
    "final_vote.confirmed": "vote tssjel : {name}",
    "final_vote.votes_received": "{count}/{total} votes wslo",
    "final_vote.all_counted": "votes kamlin t7sbo",

    // Intruder guess
    "intruder_guess.title": "nta l'intrus",
    "intruder_guess.description": "khtar l animal bach trb7 3 points",
    "intruder_guess.find_animal": "khtar l animal s7i7 bach trb7",
    "intruder_guess.submit": "valider choix",
    "intruder_guess.already_submitted": "rah deja validiti choix dialk",
    "intruder_guess.already_validated": "rah deja validiti",
    "intruder_guess.selected": "{animal} tkhtar",
    "intruder_guess.select_animal": "khtar chi 7ayawan",
    "intruder_guess.confirmed": "jawab tssjel : {animal}",

    // Results
    "results.title": "Résultats",
    "results.intruder_was": "l'intrus kan howa",
    "results.unknown": "ma3rfnach",
    "results.final_scores": "scores final",
    "results.continue_playing": "tzido tr7 akhr ?",
    "results.play_again": "tzido tr7 akhr ?",
    "results.back_to_lobby": "rje3 l salle",
    "results.intruder_found_animal": "l'intrus l9a l animal : {animal}",
    "results.intruder_not_found_animal": "l'intrus mal9ach l animal",
    "results.animal_was": "l animal kan : {animal}",
    "results.first_game": "awel partie",
    "results.game_number": "Partie {number}",
    "results.intruder_victorious": "l'intrus rb7kum 🙂",
    "results.intruder_discovered": "m3lmin l9ituh",
    "results.winner": "rab7",
    "results.points": "{points} pts",
    "results.points_this_game": "+{points} pts f had partie",
    "results.points_total": "{points} pts total",
    "results.cannot_replay": "maymknch t3awd l game",
    "results.waiting": "tsna...",
    "results.vote_saved_waiting": "vote tssjel, tsna lakhrin",
    "results.back_lobby": "rje3 l salle...",
    "results.new_game_soon": "game jdida f 2 secondes...",
    "results.cannot_continue": "maymknch tkmlou",

    // Tutorial
    "tutorial.title": "Mer7ba bik f Intrus Game !",
    "tutorial.subtitle": "chof kifach tl3b b simple",
    "tutorial.step1_title": "1. crée wla dkhl l salle",
    "tutorial.step1_text": "khass au min 3 joueurs. wa7d ycree salle w ysift code l lakhrin.",
    "tutorial.step2_title": "2. chof role dialk",
    "tutorial.step2_text": "kol joueur kayakhod animal. wa7d kaykon howa l'intrus w 3ndo animal akhor.",
    "tutorial.step3_title": "3. swlo as2ila",
    "tutorial.step3_text": "swlo as2ila b Oui/Non bach tl9aw l'intrus.",
    "tutorial.step4_title": "4. votiw 3la l'intrus",
    "tutorial.step4_text": "mn b3d as2ila, votiw 3la li kayban likom howa l'intrus.",
    "tutorial.start": "bda tl3b",

    // Help
    "help.title": "kifach tl3b Intrus Game",
    "help.rules_title": "rules dial l game :",
    "help.rule1": "wa7d joueur kaykon howa l'intrus",
    "help.rule2": "lakhrin khasshom yl9aw chkoun howa",
    "help.rule3": "swlo as2ila bach tfi9o b jawabat li fihom chk",
    "help.rule4": "f lakher votiw 3la l'intrus",
    "help.close": "sdd"
  }
};

(function () {
  const STORAGE_KEY = 'intrus_language';
  const SESSION_KEY = 'intrus_player_language';
  const DEFAULT_LANGUAGE = 'fr';

  function getLanguage() {
    const sessionLang = sessionStorage.getItem(SESSION_KEY);
    if (translations[sessionLang]) return sessionLang;
    const saved = localStorage.getItem(STORAGE_KEY);
    return translations[saved] ? saved : DEFAULT_LANGUAGE;
  }

  function getPreferredLanguage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return translations[saved] ? saved : DEFAULT_LANGUAGE;
  }

  function setLanguage(lang) {
    const nextLang = translations[lang] ? lang : DEFAULT_LANGUAGE;
    sessionStorage.setItem(SESSION_KEY, nextLang);
    localStorage.setItem(STORAGE_KEY, nextLang);
    document.documentElement.lang = nextLang === 'darija' ? 'ary' : 'fr';
    applyTranslations();
    document.dispatchEvent(new CustomEvent('language:changed', { detail: { lang: nextLang } }));
  }

  function interpolate(text, params = {}) {
    return String(text).replace(/\{(\w+)\}/g, (_, key) => {
      return Object.prototype.hasOwnProperty.call(params, key) ? params[key] : `{${key}}`;
    });
  }

  function t(key, params = {}) {
    const lang = getLanguage();
    const value = translations[lang]?.[key] ?? translations.fr?.[key] ?? key;
    return interpolate(value, params);
  }

  function applyTranslations(root = document) {
    const lang = getLanguage();
    document.documentElement.lang = lang === 'darija' ? 'ary' : 'fr';
    root.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      el.setAttribute('placeholder', t(el.dataset.i18nPlaceholder));
    });
    root.querySelectorAll('[data-i18n-title]').forEach((el) => {
      el.setAttribute('title', t(el.dataset.i18nTitle));
    });
    root.querySelectorAll('[data-i18n-value]').forEach((el) => {
      el.setAttribute('value', t(el.dataset.i18nValue));
    });
    const pageTitle = document.querySelector('meta[name="i18n-title"]')?.content;
    if (pageTitle) document.title = t(pageTitle);
  }

  function ensureLanguageSelected() {
    const sessionLang = sessionStorage.getItem(SESSION_KEY);
    return !!translations[sessionLang];
  }

  function clearSessionLanguage() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  function serverMessage(message) {
    const map = {
      'Veuillez entrer un pseudo': 'room.name_required',
      'Le pseudo doit contenir au moins 2 caractères': 'room.name_too_short',
      'Le pseudo contient des caractères interdits': 'room.name_invalid',
      'Salle introuvable': 'room.not_found',
      'Salle pleine': 'room.full',
      'La partie a déjà commencé': 'room.game_started',
      'Impossible de rejoindre, partie déjà démarrée': 'join.game_already_started',
      'Impossible de recoller: joueur inconnu': 'game.reconnect_error',
      "Seul l'hôte peut démarrer.": 'room.only_host',
      'Au moins 3 joueurs requis (min 3).': 'room.min_players_required',
      'Attendez que tous les joueurs soient prêts': 'room.wait_all_ready'
    };
    const duplicateMatch = String(message || '').match(/^Le pseudo "(.+)" est déjà utilisé/);
    if (duplicateMatch) return t('room.name_taken_full', { name: duplicateMatch[1] });
    return map[message] ? t(map[message]) : message;
  }

  window.translations = translations;
  window.i18n = { getLanguage, getPreferredLanguage, setLanguage, t, applyTranslations, ensureLanguageSelected, clearSessionLanguage, serverMessage };
  window.t = t;

  document.addEventListener('DOMContentLoaded', () => applyTranslations());
})();
