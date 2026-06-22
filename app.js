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
  var phase = "word";      // current phase view: "board" | "word" | "timer"

  // Round-type is NOT modelled in the frozen core (every tile is "all-play").
  // We DERIVE a Single-Team vs All-Play flag in the UI layer for the whole-screen
  // signal: alternate by round number (odd = All Play, even = Single Team) and, on
  // single-team rounds, spotlight the team whose turn it is (round-robin). This is
  // purely presentational — movement/win/turn logic stays in lib/.
  function isAllPlayRound() { return (round % 2) === 1; }
  function spotlightTeamIndex() {
    if (!state || !state.teams.length) return 0;
    return (round - 1) % state.teams.length;
  }

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
    // Bug 10: "Next word" kept showing the SAME word. Avoid an immediate repeat by
    // re-drawing when the pick matches the previous word (only if alternatives exist).
    var word = chosen[Math.floor(rng() * chosen.length)];
    if (chosen.length > 1 && currentWord && word.en === currentWord.en) {
      var others = chosen.filter(function (w) { return w.en !== currentWord.en; });
      word = others[Math.floor(rng() * others.length)];
    }
    return word;
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
      // Bug 9: on focus, select all text so one keystroke replaces a default name.
      input.addEventListener("focus", function (e) { e.target.select(); });
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
    blurWord();                       // start blurred; reveal only on hold
    $("wordCat").textContent = currentTile.category || "—";
    $("rollResult").textContent = "";
    resolvedThisRound = false;
    pendingWinnerId = null;
    hideRollPrompt();
    renderRoundBanner();
    renderResolveButtons();
    renderBoard();
    cancelPreroll();   // a fresh word: no stale countdown; show the Start Timer button
    // Auto-advance: a fresh word starts on the Secret Word phase so the drawer reveals it.
    setPhase("word");
  }

  // ---- phases -------------------------------------------------------------
  var PHASES = ["board", "word", "timer"];
  function setPhase(p) {
    if (PHASES.indexOf(p) === -1) p = "word";
    phase = p;
    PHASES.forEach(function (name) {
      var view = $("phase" + name.charAt(0).toUpperCase() + name.slice(1));
      var tab = $("tab" + name.charAt(0).toUpperCase() + name.slice(1));
      var active = (name === p);
      if (view) view.hidden = !active;
      if (tab) {
        tab.classList.toggle("active", active);
        tab.setAttribute("aria-selected", String(active));
      }
    });
    window.scrollTo(0, 0);
  }

  // ---- round-type whole-screen signal -------------------------------------
  function renderRoundBanner() {
    var banner = $("roundBanner");
    var allPlay = isAllPlayRound();
    $("roundNumber").textContent = round;
    banner.classList.toggle("round-allplay", allPlay);
    banner.classList.toggle("round-single", !allPlay);

    if (allPlay) {
      $("roundType").textContent = "All Play!";
      $("roundTypeEs").textContent = "¡Todos juegan!";
      $("roundTeam").textContent = "Every team draws & guesses · Todos los equipos";
      // All-play uses the brand accent across the whole screen.
      document.body.style.setProperty("--round-color", "var(--ds-accent, #e8714f)");
      banner.style.removeProperty("background");
    } else {
      var ti = spotlightTeamIndex();
      var color = TOKEN_COLORS[ti % TOKEN_COLORS.length];
      var name = state.teams[ti] ? state.teams[ti].name : ("Team " + (ti + 1));
      $("roundType").textContent = "Single Team";
      $("roundTypeEs").textContent = "Equipo único";
      $("roundTeam").textContent = name + " draws · " + name + " dibuja";
      document.body.style.setProperty("--round-color", color);
      banner.style.background = color;
    }
    // Tint the whole screen so the round type is unmistakable at a glance.
    document.body.classList.toggle("body-allplay", allPlay);
    document.body.classList.toggle("body-single", !allPlay);
  }

  // ---- secret word blur / hold-to-reveal ----------------------------------
  function revealWord() {
    $("wordEn").classList.add("revealed");
    $("wordEs").classList.add("revealed");
    $("revealBtn").classList.add("revealing");
    $("revealBtn").setAttribute("aria-pressed", "true");
  }
  function blurWord() {
    $("wordEn").classList.remove("revealed");
    $("wordEs").classList.remove("revealed");
    var rb = $("revealBtn");
    if (rb) { rb.classList.remove("revealing"); rb.setAttribute("aria-pressed", "false"); }
  }

  function renderResolveButtons() {
    var wrap = $("resolveButtons");
    wrap.innerHTML = "";
    state.teams.forEach(function (t, ti) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = t.name;
      btn.style.borderColor = TOKEN_COLORS[ti % TOKEN_COLORS.length];
      btn.disabled = resolvedThisRound || pendingWinnerId !== null || state.winner !== null;
      btn.addEventListener("click", function () { resolve(t.id); });
      wrap.appendChild(btn);
    });
  }

  // Item 8 — round resolution routes through the Board:
  //   pick winner -> go to BOARD -> "Roll dice" (animated) -> token moves -> Next word.
  // The team picker (Timer tab) only SELECTS the winner here; the actual roll/movement
  // is deferred to the Board's Roll-dice button, which calls Turn.resolveGuess.
  var pendingWinnerId = null;   // winner chosen, waiting for the dice roll on the Board
  var diceAnimTimer = null;
  var DICE_FACES = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

  function resolve(teamId) {
    if (resolvedThisRound || pendingWinnerId !== null || state.winner !== null) return;
    stopPreroll();
    stopTimer();
    pendingWinnerId = teamId;
    renderResolveButtons();     // lock the picker now that a winner is chosen
    // Auto-navigate to the Board tab and present the Roll-dice control there.
    showRollPrompt();
    setPhase("board");
  }

  // Board roll UI — shows the chosen winner + a Roll-dice button (pre-roll state).
  function showRollPrompt() {
    var team = state.teams.filter(function (t) { return t.id === pendingWinnerId; })[0];
    var ti = team ? team.id : 0;
    var color = TOKEN_COLORS[ti % TOKEN_COLORS.length];
    $("rollCard").hidden = false;
    $("rollWinner").innerHTML = "<strong style='color:" + color + "'>" + team.name +
      "</strong> guessed first &mdash; roll to move! &middot; " +
      "<span lang='es'>¡" + team.name + " adivinó primero!</span>";
    var die = $("rollDie");
    die.textContent = "🎲";
    die.classList.remove("rolling");
    var btn = $("rollDiceBtn");
    btn.hidden = false; btn.disabled = false;
    $("rollOutcome").textContent = "";
    $("boardNextRound").hidden = true;
  }

  function hideRollPrompt() {
    var card = $("rollCard");
    if (card) card.hidden = true;
    if (diceAnimTimer) { clearInterval(diceAnimTimer); diceAnimTimer = null; }
  }

  function rollDiceForWinner() {
    if (pendingWinnerId === null || resolvedThisRound || state.winner !== null) return;
    var teamId = pendingWinnerId;
    var btn = $("rollDiceBtn");
    btn.disabled = true;
    var die = $("rollDie");
    die.classList.add("rolling");
    sound.roll();

    // Resolve via the FROZEN lib (it does the rolling + movement); we only animate.
    var res = Turn.resolveGuess(state, teamId, rng);

    // ~1s dice animation cycling faces, then settle on the real roll face.
    var ticks = 0;
    diceAnimTimer = setInterval(function () {
      ticks += 1;
      die.textContent = DICE_FACES[1 + (ticks % 6)];
      if (ticks >= 9) {
        clearInterval(diceAnimTimer); diceAnimTimer = null;
        die.textContent = DICE_FACES[res.roll] || ("🎲" + res.roll);
        die.classList.remove("rolling");
        applyRollResult(res, teamId);
      }
    }, 110);
  }

  function applyRollResult(res, teamId) {
    state = res.state;
    resolvedThisRound = true;
    pendingWinnerId = null;
    var team = state.teams.filter(function (t) { return t.id === teamId; })[0];
    var msg = "🎲 <strong>" + team.name + "</strong> rolled <strong>" + res.roll +
      "</strong> &rarr; tile " + team.pos + ".";
    $("rollOutcome").innerHTML = msg;
    $("rollResult").innerHTML = msg;   // mirror on the Timer tab's resolve card
    renderBoard();                      // re-render moves the token to its new tile
    animateWinnerToken(teamId);
    renderResolveButtons();
    if (res.won) {
      sound.win();
      var banner = $("winBanner");
      banner.style.display = "block";
      banner.innerHTML = "🏆 <strong>" + team.name + "</strong> wins! &middot; " +
        "<span lang='es'>¡" + team.name + " gana!</span>";
      $("nextRound").disabled = true;
    } else {
      // Prompt for the next word right on the Board so the host stays in this flow.
      var bn = $("boardNextRound");
      bn.hidden = false;
    }
  }

  // Pulse the moved team's token so the move reads clearly on the board.
  function animateWinnerToken(teamId) {
    var ti = teamId;
    var dots = document.querySelectorAll("#board .token");
    Array.prototype.forEach.call(dots, function (d) {
      if (d.textContent === String(ti + 1)) {
        d.classList.remove("token-moved");
        // reflow to restart the animation
        void d.offsetWidth;
        d.classList.add("token-moved");
      }
    });
  }

  function nextRound() {
    if (state.winner !== null) return;
    round += 1;
    resetTimer();
    newRoundWord();   // bumps round banner + auto-advances back to the Secret Word phase
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
    refreshPreroll();    // round timer now running -> hide the Secret Word Start button
    setPhase("timer");   // auto-advance: drawing has begun, show the clock
    $("startTimer").textContent = "Pause";
    timerInterval = setInterval(function () {
      timerRemaining -= 1;
      if (timerRemaining <= 0) {
        timerRemaining = 0;
        paintTimer();
        stopTimer();
        sound.timesUp();
        $("startTimer").textContent = "Start Timer";
        // Auto-advance: time's up -> score the round (pick the winner) on this phase.
        setPhase("timer");
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
    refreshPreroll();
  }
  function resetTimer() {
    stopTimer();
    timerRemaining = timerTotal;
    paintTimer();
  }

  // ---- Secret Word pre-roll (device-handoff countdown) --------------------
  // Shows a "Start Timer" button on the Secret Word view while the round timer
  // is NOT running. Tapping it runs a 5->0 countdown; on reaching 0 it reuses
  // the existing startTimer() engine (which auto-navigates to the Timer tab).
  // Cancel aborts and keeps the player on the Secret Word view.
  var PREROLL_FROM = 5;
  var prerollCount = 0, prerollTimer = null;

  function prerollActive() { return prerollTimer !== null; }

  function stopPreroll() {
    if (prerollTimer) { clearInterval(prerollTimer); prerollTimer = null; }
  }

  // Reflect timer/pre-roll state on the Secret Word view's controls.
  function refreshPreroll() {
    var btn = $("wordStartTimer"), box = $("preroll");
    if (!btn || !box) return;
    var running = prerollActive();
    // The Start button is only for the not-yet-started state.
    btn.hidden = timerRunning || running;
    box.hidden = !running;
  }

  function beginPreroll() {
    if (timerRunning || prerollActive()) return;
    if (state && state.winner !== null) return;
    ensureAudio();
    prerollCount = PREROLL_FROM;
    $("prerollCount").textContent = prerollCount;
    // Assign the interval handle FIRST so prerollActive() is true when we
    // refresh the controls — otherwise the countdown box stays hidden (bug 7).
    prerollTimer = setInterval(function () {
      prerollCount -= 1;
      if (prerollCount <= 0) {
        stopPreroll();
        refreshPreroll();
        startTimer();        // reuse existing engine: auto-navigates + starts round timer
        return;
      }
      $("prerollCount").textContent = prerollCount;
      sound.tick();
    }, 1000);
    refreshPreroll();        // now prerollActive() is true -> count + Cancel become visible
    sound.tick();
  }

  function cancelPreroll() {
    stopPreroll();
    refreshPreroll();        // abort: stay on the Secret Word view, timer not started
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
    $("winBanner").style.display = "none";
    $("nextRound").disabled = false;
    $("setup").style.display = "none";
    $("game").style.display = "block";
    resetTimer();
    newRoundWord();   // sets round banner + auto-advances to the Secret Word phase
    ensureAudio();
    window.scrollTo(0, 0);
  }

  function endGame() {
    stopPreroll();
    stopTimer();
    hideRollPrompt();
    pendingWinnerId = null;
    state = null;
    document.body.classList.remove("body-allplay", "body-single");
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
    $("rollDiceBtn").addEventListener("click", rollDiceForWinner);
    $("boardNextRound").addEventListener("click", nextRound);
    $("startTimer").addEventListener("click", function () {
      if (timerRunning) stopTimer(); else startTimer();
    });
    $("resetTimer").addEventListener("click", resetTimer);
    $("muteBtn").addEventListener("click", toggleMute);

    // Secret Word pre-roll: Start Timer button -> 5..0 countdown -> reuse startTimer().
    var wst = $("wordStartTimer"); if (wst) wst.addEventListener("click", beginPreroll);
    var pc = $("prerollCancel"); if (pc) pc.addEventListener("click", cancelPreroll);

    // Phase tabs — manual navigation at any time (timer keeps running across switches).
    ["Board", "Word", "Timer"].forEach(function (cap) {
      var tab = $("tab" + cap);
      if (tab) tab.addEventListener("click", function () { setPhase(cap.toLowerCase()); });
    });

    // Secret Word: blurred by default; reveal ONLY while the button is held.
    var rb = $("revealBtn");
    if (rb) {
      var hold = function (e) { e.preventDefault(); revealWord(); };
      var release = function () { blurWord(); };
      rb.addEventListener("pointerdown", hold);
      rb.addEventListener("pointerup", release);
      rb.addEventListener("pointerleave", release);
      rb.addEventListener("pointercancel", release);
      // Touch fallback for browsers without Pointer Events.
      rb.addEventListener("touchstart", hold, { passive: false });
      rb.addEventListener("touchend", release);
      rb.addEventListener("touchcancel", release);
      // Keyboard accessibility: reveal while Space/Enter held.
      rb.addEventListener("keydown", function (e) {
        if (e.key === " " || e.key === "Enter") { e.preventDefault(); revealWord(); }
      });
      rb.addEventListener("keyup", release);
      rb.addEventListener("blur", release);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }
})();
