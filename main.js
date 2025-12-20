
        const CIRCUMFERENCE = 2 * Math.PI * 120;
        
        const CATEGORIES = {
            "1": ["Ordinateur", "Programmation", "Interface", "Vitesse", "Clavier", "Performance", "Développement", "Algorithme", "Navigateur", "Internet", "Application", "Données", "Utilisateur", "Système", "Logiciel", "Écran", "Tablette", "Smartphone", "Réseau", "Serveur"],
            "2": ["Le code est de la poésie.", "La vitesse est un art.", "Maîtrisez votre clavier.", "Le développement web est passionnant.", "L'innovation ne s'arrête jamais.", "Écrivez le futur aujourd'hui.", "Coder c'est créer le monde.", "La tech change nos vies.", "L'IA est une révolution."],
            "3": ["Thomas", "Léa", "Alexandre", "Camille", "Nicolas", "Sarah", "Julien", "Chloé", "Maxime", "Emma", "Antoine", "Inès", "Hugo", "Manon", "Lucas", "Alice", "Gabriel", "Jade", "Louis", "Lina"]
        };

        const DIFF_SETTINGS = {
            easy: { timeMult: 1.5, scoreMult: 0.7, label: "Facile" },
            normal: { timeMult: 1, scoreMult: 1, label: "Normal" },
            hard: { timeMult: 0.5, scoreMult: 2, label: "Difficile" }
        };

        const BASE_TIMES = { "1": 15, "2": 25, "3": 10 };

        const gameState = {
            score: 0,
            index: 0,
            listeProposition: [],
            timer: 0,
            dureeParMot: 0,
            interval: null,
            totalLettresReussies: 0,
            tempsTotalEcoule: 0,
            jeuEnCours: false,
            modeActuel: "1",
            diffActuelle: "normal",
            historique: []
        };

        const displayProposition = document.getElementById('displayProposition');
        const inputEcriture = document.getElementById('inputEcriture');
        const scoreText = document.getElementById('scoreText');
        const timerValue = document.getElementById('timerValue');
        const progressCircle = document.getElementById('progressCircle');
        const wpmValue = document.getElementById('wpmValue');
        const diffLabel = document.getElementById('diffLabel');
        const btnDemarrer = document.getElementById('btnDemarrerPause');

        // Gestion de l'historique et des thèmes
        function saveToHistory(score) {
            const data = { score, date: new Date().toLocaleDateString(), wpm: wpmValue.textContent.split(' ')[0] };
            gameState.historique.unshift(data);
            if(gameState.historique.length > 5) gameState.historique.pop();
            localStorage.setItem('wiloHistory', JSON.stringify(gameState.historique));
            updateRecordUI();
        }

        function updateRecordUI() {
            const saved = localStorage.getItem('wiloHistory');
            if(saved) {
                gameState.historique = JSON.parse(saved);
                const high = Math.max(...gameState.historique.map(h => h.score), 0);
                document.getElementById('highScoreText').textContent = high;
                
                const list = document.getElementById('historyList');
                list.innerHTML = '';
                gameState.historique.forEach(h => {
                    list.innerHTML += `<div class="history-item"><span>${h.date}</span> <span>${h.score} pts (${h.wpm} WPM)</span></div>`;
                });
            }
        }

        function setTheme(t) {
            document.body.setAttribute('data-theme', t);
            localStorage.setItem('wiloTheme', t);
        }

        function openModal(id) { document.getElementById(id).style.display = 'flex'; }
        function closeModal(id) { document.getElementById(id).style.display = 'none'; }

        function shuffle(array) {
            let currentIndex = array.length, randomIndex;
            while (currentIndex != 0) {
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex--;
                [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
            }
            return array;
        }

        function setCircleProgress(percent) {
            const offset = CIRCUMFERENCE - (percent / 100 * CIRCUMFERENCE);
            progressCircle.style.strokeDashoffset = offset;
            progressCircle.style.stroke = percent < 25 ? "var(--error)" : (percent < 50 ? "var(--accent)" : "var(--primary)");
        }

        function afficherProposition() {
            const mot = gameState.listeProposition[gameState.index];
            displayProposition.textContent = mot || "";
        }

        function demarrerJeu() {
            gameState.score = 0;
            gameState.index = 0;
            gameState.totalLettresReussies = 0;
            gameState.tempsTotalEcoule = 0;
            gameState.jeuEnCours = true;
            
            const settings = DIFF_SETTINGS[gameState.diffActuelle];
            gameState.dureeParMot = Math.round(BASE_TIMES[gameState.modeActuel] * settings.timeMult);
            gameState.timer = gameState.dureeParMot;
            
            gameState.listeProposition = shuffle([...CATEGORIES[gameState.modeActuel]]);
            
            scoreText.textContent = "0";
            diffLabel.textContent = settings.label;
            inputEcriture.disabled = false;
            inputEcriture.value = "";
            
            document.getElementById('controls').style.opacity = "0.2";
            document.getElementById('controls').style.pointerEvents = "none";
            document.getElementById('btnLabel').textContent = "Pause";
            document.getElementById('iconPlay').style.display = "none";
            document.getElementById('iconPause').style.display = "inline";
            
            afficherProposition();
            lancerChrono();
            setTimeout(() => inputEcriture.focus(), 50);
        }

        function lancerChrono() {
            if (gameState.interval) clearInterval(gameState.interval);
            gameState.interval = setInterval(() => {
                if (gameState.timer > 0) {
                    gameState.timer--;
                    gameState.tempsTotalEcoule++;
                    timerValue.textContent = gameState.timer + "s";
                    setCircleProgress((gameState.timer / gameState.dureeParMot) * 100);
                } else {
                    passerSuivant(false);
                }
            }, 1000);
        }

        function arreterChrono() {
            if (gameState.interval) { clearInterval(gameState.interval); gameState.interval = null; }
        }

        function passerSuivant(reussi = true) {
            arreterChrono();
            gameState.index++;
            inputEcriture.value = "";
            
            if (gameState.index >= gameState.listeProposition.length) {
                terminerJeu();
            } else {
                gameState.timer = gameState.dureeParMot;
                setCircleProgress(100);
                afficherProposition();
                lancerChrono();
            }
        }

        function validerSaisie() {
            const motActuel = gameState.listeProposition[gameState.index];
            const saisie = inputEcriture.value.trim();
            
            if (saisie === motActuel) {
                const settings = DIFF_SETTINGS[gameState.diffActuelle];
                const basePoints = motActuel.length * 10;
                const speedBonus = gameState.timer * 5;
                gameState.score += Math.round((basePoints + speedBonus) * settings.scoreMult);
                gameState.totalLettresReussies += motActuel.length;
                
                scoreText.textContent = gameState.score;
                scoreText.classList.add('score-bump');
                setTimeout(() => scoreText.classList.remove('score-bump'), 200);
                
                const minutes = gameState.tempsTotalEcoule / 60;
                const wpm = minutes > 0 ? Math.round((gameState.totalLettresReussies / 5) / minutes) : 0;
                wpmValue.innerHTML = `${wpm} <small style="font-size:0.6rem">WPM</small>`;
                
                passerSuivant(true);
            } else {
                inputEcriture.classList.add('shake');
                setTimeout(() => {
                    inputEcriture.classList.remove('shake');
                    passerSuivant(false);
                }, 400);
            }
        }

        function terminerJeu() {
            arreterChrono();
            gameState.jeuEnCours = false;
            inputEcriture.disabled = true;
            saveToHistory(gameState.score);
            document.getElementById('finalScore').textContent = gameState.score;
            const minutes = gameState.tempsTotalEcoule / 60;
            document.getElementById('finalWPM').textContent = minutes > 0 ? Math.round((gameState.totalLettresReussies / 5) / minutes) : 0;
            document.getElementById('popupBackground').style.display = "flex";
        }

        btnDemarrer.addEventListener('click', () => {
            if (!gameState.jeuEnCours) {
                if (document.getElementById('btnLabel').textContent === "Reprendre") {
                    gameState.jeuEnCours = true;
                    inputEcriture.disabled = false;
                    document.getElementById('btnLabel').textContent = "Pause";
                    document.getElementById('iconPlay').style.display = "none";
                    document.getElementById('iconPause').style.display = "inline";
                    lancerChrono();
                    inputEcriture.focus();
                } else {
                    demarrerJeu();
                }
            } else {
                arreterChrono();
                gameState.jeuEnCours = false;
                inputEcriture.disabled = true;
                document.getElementById('btnLabel').textContent = "Reprendre";
                document.getElementById('iconPlay').style.display = "inline";
                document.getElementById('iconPause').style.display = "none";
            }
        });

        inputEcriture.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && gameState.jeuEnCours) validerSaisie();
        });

        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!gameState.jeuEnCours) {
                    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    gameState.modeActuel = btn.getAttribute('data-mode');
                    const settings = DIFF_SETTINGS[gameState.diffActuelle];
                    timerValue.textContent = Math.round(BASE_TIMES[gameState.modeActuel] * settings.timeMult) + "s";
                }
            });
        });

        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!gameState.jeuEnCours) {
                    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    gameState.diffActuelle = btn.getAttribute('data-diff');
                    const settings = DIFF_SETTINGS[gameState.diffActuelle];
                    diffLabel.textContent = settings.label;
                    timerValue.textContent = Math.round(BASE_TIMES[gameState.modeActuel] * settings.timeMult) + "s";
                }
            });
        });

        window.onload = () => {
            setCircleProgress(100);
            updateRecordUI();
            const t = localStorage.getItem('wiloTheme');
            if(t) setTheme(t);
            timerValue.textContent = BASE_TIMES["1"] + "s";
        };
