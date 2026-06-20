// Bilingual Pictionary -- single-device pass-and-draw mode.
// v1 scope: no online multiplayer, no live drawing-stream (see STATUS.md).
(function () {
  var storageKey = "bilingual-pictionary:setup";

  var setupEl = document.getElementById("setup");
  var gameEl = document.getElementById("game");
  var teamCountSel = document.getElementById("teamCount");
  var teamNamesEl = document.getElementById("teamNames");
  var tierSel = document.getElementById("tier");
  var timerSecondsSel = document.getElementById("timerSeconds");
  var startBtn = document.getElementById("startGame");

  var currentTeamEl = document.getElementById("currentTeam");
  var roundNumberEl = document.getElementById("roundNumber");
  var wordEnEl = document.getElementById("wordEn");
  var wordEsEl = document.getElementById("wordEs");
  var revealBtn = document.getElementById("revealWord");
  var diceFaceEl = document.getElementById("diceFace");
  var rollDiceBtn = document.getElementById("rollDice");
  var timerDisplayEl = document.getElementById("timerDisplay");
  var startTimerBtn = document.getElementById("startTimer");
  var correctBtn = document.getElementById("markCorrect");
  var skipBtn = document.getElementById("skipWord");
  var scoresEl = document.getElementById("scores");
  var endGameBtn = document.getElementById("endGame");

  var RANDOM_TEAM_NAMES = [
    "Red Pandas", "Blue Whales", "Green Iguanas", "Golden Eagles",
    "Silver Foxes", "Purple Llamas", "Orange Toucans", "Pink Flamingos"
  ];

  var DICE_ACTIONS = [
    { n: 1, en: "Draw normally", es: "Dibuja normal" },
    { n: 2, en: "Draw with eyes closed", es: "Dibuja con los ojos cerrados" },
    { n: 3, en: "Draw with your non-dominant hand", es: "Dibuja con tu mano no dominante" },
    { n: 4, en: "No talking, no sounds at all", es: "Sin hablar, sin sonidos" },
    { n: 5, en: "Teammates can ask 3 yes/no questions", es: "El equipo puede hacer 3 preguntas de sí/no" },
    { n: 6, en: "Double points this round", es: "Puntos dobles esta ronda" }
  ];

  var state = null;

  function pickRandomTeamName(usedNames) {
    var pool = RANDOM_TEAM_NAMES.filter(function (n) { return usedNames.indexOf(n) === -1; });
    if (pool.length === 0) pool = RANDOM_TEAM_NAMES;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function renderTeamNameInputs() {
    var count = parseInt(teamCountSel.value, 10);
    var used = [];
    teamNamesEl.innerHTML = "";
    for (var i = 0; i < count; i++) {
      var name = pickRandomTeamName(used);
      used.push(name);
      var wrap = document.createElement("div");
      wrap.className = "team-name-input";
      var label = document.createElement("label");
      label.textContent = "Team " + (i + 1) + ":";
      var input = document.createElement("input");
      input.type = "text";
      input.value = name;
      input.dataset.idx = i;
      wrap.appendChild(label);
      wrap.appendChild(input);
      teamNamesEl.appendChild(wrap);
    }
  }

  function wordPoolForTier(tier) {
    if (tier === "any") return window.WORD_BANK.slice();
    return window.WORD_BANK.filter(function (w) { return w.tier === tier; });
  }

  function drawWord() {
    var pool = state.remainingWords.length ? state.remainingWords : wordPoolForTier(state.tier);
    if (!state.remainingWords.length) {
      state.remainingWords = pool.slice();
    }
    var idx = Math.floor(Math.random() * state.remainingWords.length);
    var word = state.remainingWords.splice(idx, 1)[0];
    return word;
  }

  function startGame() {
    var nameInputs = teamNamesEl.querySelectorAll("input[type=text]");
    var teams = [];
    for (var i = 0; i < nameInputs.length; i++) {
      teams.push({ name: nameInputs[i].value || ("Team " + (i + 1)), score: 0 });
    }
    state = {
      teams: teams,
      currentTeamIdx: 0,
      round: 1,
      tier: tierSel.value,
      timerSeconds: parseInt(timerSecondsSel.value, 10),
      remainingWords: [],
      currentWord: null,
      revealed: false,
      timerInterval: null,
      timerRemaining: 0
    };
    saveSetup();
    setupEl.style.display = "none";
    gameEl.style.display = "block";
    nextTurn();
  }

  function saveSetup() {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        teamCount: teamCountSel.value, tier: tierSel.value, timerSeconds: timerSecondsSel.value
      }));
    } catch (e) {}
  }

  function loadSetup() {
    try {
      var raw = localStorage.getItem(storageKey);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (saved.teamCount) teamCountSel.value = saved.teamCount;
      if (saved.tier) tierSel.value = saved.tier;
      if (saved.timerSeconds) timerSecondsSel.value = saved.timerSeconds;
    } catch (e) {}
  }

  function nextTurn() {
    clearTimerInterval();
    state.currentWord = drawWord();
    state.revealed = false;
    wordEnEl.textContent = "???";
    wordEsEl.textContent = "???";
    wordEnEl.classList.remove("revealed");
    wordEsEl.classList.remove("revealed");
    diceFaceEl.textContent = "-";
    timerDisplayEl.textContent = formatTime(state.timerSeconds);
    currentTeamEl.textContent = state.teams[state.currentTeamIdx].name;
    roundNumberEl.textContent = state.round;
    renderScores();
  }

  function formatTime(sec) {
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  }

  function revealWord() {
    state.revealed = true;
    wordEnEl.textContent = state.currentWord.en;
    wordEsEl.textContent = state.currentWord.es;
    wordEnEl.classList.add("revealed");
    wordEsEl.classList.add("revealed");
  }

  function rollDice() {
    var roll = DICE_ACTIONS[Math.floor(Math.random() * DICE_ACTIONS.length)];
    diceFaceEl.textContent = roll.n + ": " + roll.en + " / " + roll.es;
  }

  function clearTimerInterval() {
    if (state && state.timerInterval) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }
  }

  function startTimer() {
    clearTimerInterval();
    state.timerRemaining = state.timerSeconds;
    timerDisplayEl.textContent = formatTime(state.timerRemaining);
    state.timerInterval = setInterval(function () {
      state.timerRemaining -= 1;
      timerDisplayEl.textContent = formatTime(Math.max(state.timerRemaining, 0));
      if (state.timerRemaining <= 0) {
        clearTimerInterval();
        timerDisplayEl.textContent = "Time!";
      }
    }, 1000);
  }

  function advanceTeamAndRound() {
    state.currentTeamIdx = (state.currentTeamIdx + 1) % state.teams.length;
    if (state.currentTeamIdx === 0) state.round += 1;
  }

  function markCorrect() {
    state.teams[state.currentTeamIdx].score += 1;
    advanceTeamAndRound();
    nextTurn();
  }

  function skipWord() {
    advanceTeamAndRound();
    nextTurn();
  }

  function renderScores() {
    scoresEl.innerHTML = "";
    state.teams.forEach(function (t) {
      var row = document.createElement("div");
      row.className = "score-row";
      row.textContent = t.name + ": " + t.score;
      scoresEl.appendChild(row);
    });
  }

  function endGame() {
    clearTimerInterval();
    gameEl.style.display = "none";
    setupEl.style.display = "block";
  }

  loadSetup();
  renderTeamNameInputs();
  teamCountSel.addEventListener("change", renderTeamNameInputs);
  startBtn.addEventListener("click", startGame);
  revealBtn.addEventListener("click", revealWord);
  rollDiceBtn.addEventListener("click", rollDice);
  startTimerBtn.addEventListener("click", startTimer);
  correctBtn.addEventListener("click", markCorrect);
  skipBtn.addEventListener("click", skipWord);
  endGameBtn.addEventListener("click", endGame);
})();
