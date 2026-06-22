// Sketch Fiesta — UI controller. Wires the DOM to the frozen, tested game core
// (window.GameRng / GameCore / GameTurn) and the bilingual WORD_BANK (words.js).
// All movement / win / dice logic lives in the libs; this file never re-implements it.
(function () {
  "use strict";

  var Rng = window.GameRng, Core = window.GameCore, Turn = window.GameTurn;
  var BANK = window.WORD_BANK || [];

  // ---- config -------------------------------------------------------------
  var BOARD_SIZE = 16;               // start + 14 all-play tiles + finish
  var COMPLEXITY_TO_TIER = {         // map board complexity -> word-bank tier
    easy: "kids", medium: "family", hard: "adults"
  };

  // Lightweight keyword map so a tile's category can pick a thematically-matching
  // word "when possible". This is metadata ABOUT existing words, not a new word
  // bank — words.js stays the single source of word data.
  var CATEGORY_KEYWORDS = {
    animals: ["dog", "cat", "fish", "bird", "cow", "pig", "duck", "frog", "dinosaur"],
    food: ["apple", "banana", "cake", "egg", "pizza", "ice cream"],
    objects: ["ball", "hat", "shoe", "book", "chair", "table", "door", "window",
              "bicycle", "umbrella", "guitar", "camera", "backpack", "skateboard", "robot"],
    actions: ["snorkeling", "swimming", "negotiation", "job interview", "time travel"],
    places: ["house", "swimming pool", "volcano", "lighthouse", "waterfall", "castle",
             "stock market", "soccer goal"],
    abstract: ["procrastination", "jealousy", "nostalgia", "inflation", "democracy",
               "sarcasm", "retirement", "bureaucracy", "compound interest",
               "artificial intelligence"],
    idioms: ["writer's block", "midlife crisis", "conspiracy theory",
             "long-distance relationship", "deja vu", "mortgage", "midlife"]
  };

  // ---- state --------------------------------------------------------------
  var state = null;        // GameTurn state {board, teams, winner}
  var rng = null;          // seeded rng function
  var seed = 0;
  var complexity = "medium";
  var round = 1;
  var currentWord = null;
  var currentTile = null;
  var resolvedThisRound = false;

  // ---- audio (WebAudio beeps, no external files) --------------------------
  var audioCtx = null, muted = false, tickTimer = null;

  function ensureAudio() {
    if (muted) return null;
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { audioCtx = null; }
    }
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  function beep(freq, durationMs, type, gainPeak) {
    var ctx = ensureAudio();
    if (!ctx) return;
    var osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.value = freq;
    var now = ctx.currentTime, dur = durationMs / 1000;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainPeak || 0.15, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now); osc.stop(now + dur);
  }

  var sound = {
    tick:    function () { beep(880, 45, "sine", 0.05); },      // soft tick
    warn:    function () { beep(440, 160, "square", 0.18); },   // last ~5s warning
    timesUp: function () {                                       // distinct times-up
      beep(330, 250, "sawtooth", 0.2);
      setTimeout(function () { beep(220, 450, "sawtooth", 0.2); }, 220);
    },
    roll:    function () { beep(660, 90, "triangle", 0.14); },
    win:     function () {
      [523, 659, 784, 1047].forEach(function (f, i) {
        setTimeout(function () { beep(f, 200, "triangle", 0.2); }, i * 160);
      });
    }
  };

  // ---- helpers ------------------------------------------------------------
  function $(id) { return document.getElementById(id); }

  function pickWord(tier, category) {
    var pool = BANK.filter(function (w) { return tier === "any" || w.tier === tier; });
    if (!pool.length) pool = BANK.slice();
    // Try to match the active tile's category.
    var keys = CATEGORY_KEYWORDS[category] || [];
    var matches = pool.filter(function (w) {
      var en = w.en.toLowerCase();
      return keys.some(function (k) { return en.indexOf(k) !== -1; });
    });
    var chosen = matches.length ? matches : pool;
    return chosen[Math.floor(rng() * chosen.length)];
  }

  // ---- setup screen -------------------------------------------------------
  function renderTeamNameInputs() {
    var count = parseInt($("teamCount").value, 10);
    var wrap = $("teamNames");
    var existing = {};
    Array.prototype.forEach.call(wrap.querySelectorAll("input"), function (inp, i) {
      existing[i] = inp.value;
    });
    wrap.innerHTML = "";
    var defaults = ["Team Coral", "Team Teal", "Team Sol", "Team Luna"];
    for (var i = 0; i < count; i++) {
      var row = document.createElement("div");
      row.className = "team-name-input";
      var label = document.createElement("label");
      label.setAttribute("for", "team" + i);
      label.textContent = "Team " + (i + 1);
      var input = document.createElement("input");
      input.id = "team" + i;
      input.type = "text";
      input.maxLength = 24;
      input.value = (existing[i] !== undefined && existing[i] !== "") ? existing[i] : defaults[i];
      row.appendChild(label); row.appendChild(input);
      wrap.appendChild(row);
    }
  }

  function getTeamNames() {
    return Array.prototype.map.call(
      $("teamNames").querySelectorAll("input"),
      function (inp, i) { return (inp.value || "").trim() || ("Team " + (i + 1)); }
    );
  }

  // ---- board rendering ----------------------------------------------------
  var TOKEN_COLORS = ["#e8714f", "#1a6e6e", "#d4a017", "#6a4c93"];

  function renderBoard() {
    var el = $("board");
    el.innerHTML = "";
    state.board.forEach(function (tile, i) {
      var cell = document.createElement("div");
      cell.className = "tile tile-" + tile.type;
      if (tile === currentTile) cell.className += " tile-active";
      var num = document.createElement("span");
      num.className = "tile-num";
      num.textContent = tile.type === "start" ? "▶" : tile.type === "finish" ? "🏁" : (i);
      cell.appendChild(num);
      if (tile.category) {
        var cat = document.createElement("span");
        cat.className = "tile-cat";
        cat.textContent = tile.category;
        cell.appendChild(cat);
      }
      var tokens = document.createElement("div");
      tokens.className = "tile-tokens";
      state.teams.forEach(function (t, ti) {
        if (t.pos === i) {
          var dot = document.createElement("span");
          dot.className = "token";
          dot.style.background = TOKEN_COLORS[ti % TOKEN_COLORS.length];
          dot.title = t.name;
          dot.textContent = (ti + 1);
          tokens.appendChild(dot);
        }
      });
      cell.appendChild(tokens);
      el.appendChild(cell);
    });
  }

  // ---- round flow ---------------------------------------------------------
  function activeTileForRound() {
    // Pick the all-play tile that is "in play": the tile just ahead of the
    // furthest team (purely for word-category flavor). Falls back to a mid tile.
    var maxPos = state.teams.reduce(function (m, t) { return Math.max(m, t.pos); }, 0);
    var idx = Math.min(maxPos + 1, state.board.length - 2);
    if (idx < 1) idx = 1;
    var tile = state.board[idx];
    if (tile.type !== "all-play") {
      tile = state.board.filter(function (t) { return t.type === "all-play"; })[0] || state.board[1];
    }
    return tile;
  }

  function newRoundWord() {
    currentTile = activeTileForRound();
    var tier = COMPLEXITY_TO_TIER[complexity] || "family";
    currentWord = pickWord(tier, currentTile.category);
    $("wordEn").textContent = currentWord.en;
    $("wordEs").textContent = currentWord.es;
    $("wordEn").classList.add("revealed");
    $("wordEs").classList.add("revealed");
    $("wordCat").textContent = currentTile.category || "—";
    $("rollResult").textContent = "";
    resolvedThisRound = false;
    renderResolveButtons();
    renderBoard();
  }

  function renderResolveButtons() {
    var wrap = $("resolveButtons");
    wrap.innerHTML = "";
    state.teams.forEach(function (t, ti) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = t.name;
      btn.style.borderColor = TOKEN_COLORS[ti % TOKEN_COLORS.length];
      btn.disabled = resolvedThisRound || state.winner !== null;
      btn.addEventListener("click", function () { resolve(t.id); });
      wrap.appendChild(btn);
    });
  }

  function resolve(teamId) {
    if (resolvedThisRound || state.winner !== null) return;
    stopTimer();
    var res = Turn.resolveGuess(state, teamId, rng);
    sound.roll();
    state = res.state;
    resolvedThisRound = true;
    var team = state.teams.filter(function (t) { return t.id === teamId; })[0];
    $("rollResult").innerHTML = "🎲 <strong>" + team.name + "</strong> rolled <strong>" +
      res.roll + "</strong> and moved to tile " + team.pos + ".";
    renderBoard();
    renderResolveButtons();
    if (res.won) {
      sound.win();
      var banner = $("winBanner");
      banner.style.display = "block";
      banner.innerHTML = "🏆 <strong>" + team.name + "</strong> wins! &middot; " +
        "<span lang='es'>¡" + team.name + " gana!</span>";
      $("nextRound").disabled = true;
    }
  }

  function nextRound() {
    if (state.winner !== null) return;
    round += 1;
    $("roundNumber").textContent = round;
    resetTimer();
    newRoundWord();
  }

  // ---- timer --------------------------------------------------------------
  var timerTotal = 60, timerRemaining = 60, timerInterval = null, timerRunning = false;

  function fmt(s) {
    var m = Math.floor(s / 60), sec = s % 60;
    return (m < 10 ? "0" : "") + m + ":" + (sec < 10 ? "0" : "") + sec;
  }
  function paintTimer() {
    var d = $("timerDisplay");
    d.textContent = fmt(timerRemaining);
    d.classList.toggle("timer-warn", timerRemaining <= 5 && timerRemaining > 0 && timerRunning);
  }
  function startTimer() {
    if (timerRunning || state.winner !== null) return;
    ensureAudio();
    timerRunning = true;
    $("startTimer").textContent = "Pause";
    timerInterval = setInterval(function () {
      timerRemaining -= 1;
      if (timerRemaining <= 0) {
        timerRemaining = 0;
        paintTimer();
        stopTimer();
        sound.timesUp();
        $("startTimer").textContent = "Start Timer";
        return;
      }
      if (timerRemaining <= 5) sound.warn(); else sound.tick();
      paintTimer();
    }, 1000);
  }
  function stopTimer() {
    timerRunning = false;
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    $("startTimer").textContent = "Start Timer";
  }
  function resetTimer() {
    stopTimer();
    timerRemaining = timerTotal;
    paintTimer();
  }

  // ---- start / end --------------------------------------------------------
  function startGame() {
    seed = Date.now();
    rng = Rng.makeRng(seed);
    complexity = $("complexity").value;
    timerTotal = parseInt($("timerSeconds").value, 10) || 60;
    var names = getTeamNames();
    state = Turn.initGame(names, BOARD_SIZE, complexity, rng);
    round = 1;
    $("roundNumber").textContent = round;
    $("winBanner").style.display = "none";
    $("nextRound").disabled = false;
    $("setup").style.display = "none";
    $("game").style.display = "block";
    resetTimer();
    newRoundWord();
    ensureAudio();
    window.scrollTo(0, 0);
  }

  function endGame() {
    stopTimer();
    state = null;
    $("game").style.display = "none";
    $("setup").style.display = "block";
    window.scrollTo(0, 0);
  }

  // ---- mute ---------------------------------------------------------------
  function toggleMute() {
    muted = !muted;
    var btn = $("muteBtn");
    btn.setAttribute("aria-pressed", String(muted));
    btn.textContent = muted ? "🔇 Muted" : "🔊 Sound";
    if (!muted) ensureAudio();
  }

  // ---- wire up ------------------------------------------------------------
  function init() {
    if (!Rng || !Core || !Turn) {
      console.error("Sketch Fiesta: game libs failed to load.");
      return;
    }
    renderTeamNameInputs();
    $("teamCount").addEventListener("change", renderTeamNameInputs);
    $("startGame").addEventListener("click", startGame);
    $("endGame").addEventListener("click", endGame);
    $("nextRound").addEventListener("click", nextRound);
    $("startTimer").addEventListener("click", function () {
      if (timerRunning) stopTimer(); else startTimer();
    });
    $("resetTimer").addEventListener("click", resetTimer);
    $("muteBtn").addEventListener("click", toggleMute);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }
})();
