// Sketch Fiesta — UI controller. Wires the DOM to the frozen, tested game core
// (window.GameRng / GameCore / GameTurn) and the bilingual WORD_BANK (words.js).
// All movement / win / dice logic lives in the libs; this file never re-implements it.
(function () {
  "use strict";

  var Rng = window.GameRng, Core = window.GameCore, Turn = window.GameTurn;
  var Host = window.GameHost;   // pure hostLines(event, state) mapper (lib/host.js)
  var MODES = window.WORD_MODES || {};
  var BANK = window.WORD_BANK || [];

  // ---- config -------------------------------------------------------------
  var BOARD_SIZE = 16;               // start + 14 all-play tiles + finish

  // Difficulty mode -> board complexity (the FROZEN lib only knows easy/medium/hard,
  // which it uses to tag board tiles). Mode drives which word categories we draw from.
  var MODE_TO_COMPLEXITY = {
    kids: "easy", family: "medium", advanced: "hard"
  };
  var CATEGORIES_PER_GAME = 5;       // pick 5 random categories per game (item 11)

  // ---- state --------------------------------------------------------------
  var state = null;        // GameTurn state {board, teams, winner}
  var rng = null;          // seeded rng function
  var seed = 0;
  var complexity = "medium";
  var mode = "family";     // chosen difficulty mode: "kids" | "family" | "advanced"
  var activeCategories = []; // the 5 category KEYS drawn at random for this game
  var round = 1;
  var currentWord = null;
  var currentWordCat = null; // KEY of the category the current word came from
  var currentTile = null;
  var activeTeamIndex = 0;  // the team "in play": its current tile drives the word category
  var resolvedThisRound = false;
  var phase = "word";      // current phase view: "board" | "word" | "timer"
  var suppressRoundAnnounce = false; // skip the voice-host round line on round 1

  // Every round is All-Play: all teams draw & guess; the first to guess rolls the
  // dice. There is no Single-Team round type (removed item 14). Movement/win/turn
  // logic stays in lib/; the UI only signals the current round number + active team.

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

  // ---- Voice Host (free browser TTS) --------------------------------------
  // Catalyst Gather's voice-assisted-multiplayer wedge: the co-located board
  // reads the game out loud via the Web Speech API (SpeechSynthesis). The host
  // is OPT-IN (default OFF, persisted in localStorage) and a thin, feature-
  // detected adapter — if speech is unavailable it is a silent no-op and NEVER
  // blocks gameplay. The spoken lines come from the pure lib/host.js mapper, so
  // we never re-implement game logic and never speak the secret word.
  var HOST_KEY = "sf_voicehost_on";
  var hostOn = false;
  var synth = (typeof window !== "undefined" && window.speechSynthesis) ? window.speechSynthesis : null;
  var SpeechUtter = (typeof window !== "undefined") ? window.SpeechSynthesisUtterance : null;

  function speechAvailable() { return !!(synth && SpeechUtter); }

  function loadHostPref() {
    try {
      var v = window.localStorage ? window.localStorage.getItem(HOST_KEY) : null;
      hostOn = (v === "1");
    } catch (e) { hostOn = false; }
  }
  function saveHostPref() {
    try { if (window.localStorage) window.localStorage.setItem(HOST_KEY, hostOn ? "1" : "0"); }
    catch (e) { /* private mode / disabled storage: ignore, stay in-memory */ }
  }

  // speak(text): cancel any in-flight utterance, then voice `text` in English.
  // Respects the host-on toggle; no-ops cleanly when speech is unavailable or
  // the text is empty (unknown events return "" from hostLines).
  function speak(text) {
    if (!hostOn || !speechAvailable()) return;
    text = (text == null) ? "" : String(text).trim();
    if (!text) return;
    try {
      synth.cancel();                 // host speaks at transitions, not over itself
      var u = new SpeechUtter(text);
      u.lang = "en-US";
      u.rate = 1.0; u.pitch = 1.0; u.volume = 1.0;
      synth.speak(u);
    } catch (e) { /* never let a speech error break the game */ }
  }

  // Convenience: build the line from game state + voice it in one call.
  function announce(event, hostState) {
    if (!hostOn || !Host) return;
    speak(Host.hostLines(event, hostState || {}));
  }

  function reflectHostBtn() {
    var btn = $("hostBtn");
    if (!btn) return;
    btn.setAttribute("aria-pressed", String(hostOn));
    btn.textContent = hostOn ? "🎙️ Host: On" : "🎙️ Host: Off";
    if (!speechAvailable()) {
      // Keep gameplay intact; just signal the host can't speak here.
      btn.disabled = true;
      btn.title = "Voice host not supported in this browser";
      btn.textContent = "🎙️ Host: n/a";
    }
  }

  function toggleHost() {
    if (!speechAvailable()) return;
    hostOn = !hostOn;
    saveHostPref();
    reflectHostBtn();
    if (hostOn) {
      // First speech needs a user gesture (this tap) to satisfy autoplay rules.
      speak("Voice host on. I'll read the game for you.");
    } else if (synth) {
      synth.cancel();
    }
  }

  // ---- helpers ------------------------------------------------------------
  function $(id) { return document.getElementById(id); }

  // Pick the game's 5 random categories from the chosen mode using the seedable
  // RNG (so a given seed reproduces the same set). Returns an array of category keys.
  function pickGameCategories(modeKey) {
    var modeObj = MODES[modeKey];
    var keys = modeObj ? Object.keys(modeObj.categories) : [];
    // Fisher–Yates shuffle driven by the seeded rng, then take the first N.
    var pool = keys.slice();
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    }
    return pool.slice(0, Math.min(CATEGORIES_PER_GAME, pool.length));
  }

  // Human-readable label for a category key within the active mode.
  function categoryLabel(catKey) {
    var modeObj = MODES[mode];
    var cat = modeObj && modeObj.categories[catKey];
    if (!cat) return catKey;
    return cat.label + (cat.labelEs ? " · " + cat.labelEs : "");
  }

  // A stable color per active category (by its position in the 5-category list),
  // so a category's tiles, chip, and accents all read as the same color.
  var CAT_COLORS = ["#e8714f", "#1a6e6e", "#d4a017", "#6a4c93", "#3a7d44"];
  function categoryColor(catKey) {
    var i = activeCategories.indexOf(catKey);
    if (i < 0) return "#5a5f66";
    return CAT_COLORS[i % CAT_COLORS.length];
  }

  // Item 13 — make the board tiles use THIS game's 5 selected categories instead
  // of the frozen lib's complexity-based set. We keep lib/* untouched: makeBoard
  // still tags tiles, then we overwrite each all-play tile's category here with a
  // deterministic pick from the 5 active category keys (driven by the seeded rng).
  function applyActiveCategoriesToBoard() {
    if (!state || !activeCategories.length) return;
    state.board.forEach(function (tile) {
      if (tile.type === "all-play") {
        tile.category = activeCategories[Math.floor(rng() * activeCategories.length)];
      }
    });
  }

  // The word pool restricted to a single category key (the active team's tile).
  function wordPoolForCategory(catKey) {
    var modeObj = MODES[mode];
    var pool = [];
    if (modeObj && catKey && modeObj.categories[catKey]) {
      modeObj.categories[catKey].words.forEach(function (w) {
        pool.push({ en: w.en, es: w.es, catKey: catKey });
      });
    }
    return pool;
  }

  // Build the draw pool: every word from the game's 5 active categories, tagged
  // with its category. Falls back to the flat WORD_BANK if anything is missing.
  function activeWordPool() {
    var modeObj = MODES[mode];
    var pool = [];
    if (modeObj) {
      activeCategories.forEach(function (catKey) {
        var cat = modeObj.categories[catKey];
        if (cat) cat.words.forEach(function (w) {
          pool.push({ en: w.en, es: w.es, catKey: catKey });
        });
      });
    }
    if (!pool.length) {
      pool = BANK.map(function (w) { return { en: w.en, es: w.es, catKey: w.category }; });
    }
    return pool;
  }

  // Draw a fresh word. If a category key is given (the active team's current tile),
  // draw only from that category (item 13); otherwise use the full 5-category pool.
  // Honors the seeded rng and avoids an immediate repeat (bug 10) when possible.
  function pickWord(catKey) {
    var pool = catKey ? wordPoolForCategory(catKey) : activeWordPool();
    if (!pool.length) pool = activeWordPool();
    if (!pool.length) return { en: "—", es: "—", catKey: catKey || null };
    var word = pool[Math.floor(rng() * pool.length)];
    if (pool.length > 1 && currentWord && word.en === currentWord.en) {
      var others = pool.filter(function (w) { return w.en !== currentWord.en; });
      word = others[Math.floor(rng() * others.length)];
    }
    return word;
  }

  // Surface the 5 active categories on the Board view so players see the game's
  // category set at a glance.
  function renderActiveCategories() {
    var wrap = $("activeCategories");
    if (!wrap) return;
    wrap.innerHTML = "";
    var modeObj = MODES[mode];
    var head = document.createElement("span");
    head.className = "active-cats-label";
    head.textContent = "Categorías:";
    wrap.appendChild(head);
    activeCategories.forEach(function (catKey) {
      var cat = modeObj && modeObj.categories[catKey];
      var chip = document.createElement("span");
      chip.className = "cat-chip";
      chip.textContent = cat ? cat.label : catKey;
      if (cat && cat.labelEs) chip.title = cat.label + " · " + cat.labelEs;
      // Color the chip to match this category's tiles (item 13 consistency).
      var color = categoryColor(catKey);
      chip.style.borderColor = color;
      chip.style.color = color;
      wrap.appendChild(chip);
    });
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
        // Show the human category label (matches the chip list) and color it to
        // match that category's chip, so tiles + list + word category all agree.
        var modeObj = MODES[mode];
        var catObj = modeObj && modeObj.categories[tile.category];
        cat.textContent = catObj ? catObj.label : tile.category;
        cat.style.color = categoryColor(tile.category);
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
    // Item 13 — the round's word comes from the tile the ACTIVE team is currently
    // standing on (the tile they last landed on). The active team is the one whose
    // turn drives this round (the last winner, or the round-robin spotlight team).
    var ti = activeTeamIndex;
    if (!state.teams[ti]) ti = 0;
    var pos = state.teams[ti].pos;
    var tile = state.board[pos];
    // Start tile (pos 0) carries no category; use the first all-play tile so the
    // very first round still has a real category.
    if (!tile || tile.type !== "all-play" || !tile.category) {
      tile = state.board.filter(function (t) { return t.type === "all-play" && t.category; })[0] || tile;
    }
    return tile;
  }

  function newRoundWord() {
    currentTile = activeTileForRound();
    currentWord = pickWord(currentTile && currentTile.category); // active team's tile category
    currentWordCat = currentWord.catKey;
    $("wordEn").textContent = currentWord.en;
    $("wordEs").textContent = currentWord.es;
    blurWord();                       // start blurred; reveal only on hold
    $("wordCat").textContent = currentWordCat ? categoryLabel(currentWordCat) : "—";
    $("rollResult").textContent = "";
    resolvedThisRound = false;
    pendingWinnerId = null;
    hideRollPrompt();
    renderRoundBanner();
    renderResolveButtons();
    renderBoard();
    cancelPreroll();   // a fresh word: no stale countdown; show the Start Timer button
    // Voice host: announce the round, whose turn, and the CATEGORY (never the
    // secret word). Skipped on the very first round, where the gameStart welcome
    // line already played, to avoid talking over it.
    if (!suppressRoundAnnounce) {
      var ti = state && state.teams[activeTeamIndex] ? activeTeamIndex : 0;
      announce("newRound", {
        round: round,
        teamName: state && state.teams[ti] ? state.teams[ti].name : null,
        categoryLabel: currentWordCat ? categoryLabel(currentWordCat) : null
      });
    }
    suppressRoundAnnounce = false;
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

  // ---- round indicator ----------------------------------------------------
  // Every round is All-Play, so there is no round-type banner. We just keep a
  // slim round counter and a color cue for the ACTIVE team (whose tile drives
  // this round's word and who rolls next after guessing).
  function renderRoundBanner() {
    var el = $("roundNumber");
    if (el) el.textContent = round;
    var ti = activeTeamIndex;
    if (!state || !state.teams[ti]) ti = 0;
    var color = TOKEN_COLORS[ti % TOKEN_COLORS.length];
    document.body.style.setProperty("--round-color", color);
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
    var scorer = state.teams.filter(function (t) { return t.id === teamId; })[0];
    announce("scored", { teamName: scorer ? scorer.name : null }); // host: guessed first
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
    // The team that just moved becomes the active team: the NEXT round's word
    // category comes from the tile they now stand on (item 13).
    activeTeamIndex = teamId;
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
      announce("win", { teamName: team.name }); // host: celebrate the winner
      var banner = $("winBanner");
      banner.style.display = "block";
      banner.innerHTML = "🏆 <strong>" + team.name + "</strong> wins! &middot; " +
        "<span lang='es'>¡" + team.name + " gana!</span>";
      $("nextRound").disabled = true;
    } else {
      // Host: narrate the dice roll + the tile the token landed on (non-winning).
      announce("roll", { teamName: team.name, roll: res.roll, tile: team.pos });
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
    announce("timerStart", { seconds: timerTotal }); // host: drawing has begun
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
        announce("timesUp", {});  // host: pencils down, who guessed it?
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
    mode = ($("mode") && $("mode").value) || "family";
    if (!MODES[mode]) mode = "family";
    complexity = MODE_TO_COMPLEXITY[mode] || "medium";
    // Pick this game's 5 random categories from the chosen mode (seeded).
    activeCategories = pickGameCategories(mode);
    renderActiveCategories();
    timerTotal = parseInt($("timerSeconds").value, 10) || 60;
    var names = getTeamNames();
    state = Turn.initGame(names, BOARD_SIZE, complexity, rng);
    // Item 13 — replace the lib's complexity-based tile categories with this
    // game's 5 randomly-selected categories (the same set shown as chips).
    applyActiveCategoriesToBoard();
    round = 1;
    activeTeamIndex = 0;
    $("winBanner").style.display = "none";
    $("nextRound").disabled = false;
    $("setup").style.display = "none";
    $("game").style.display = "block";
    resetTimer();
    // Voice host: welcome line on Start (this tap is the gesture autoplay needs).
    announce("gameStart", { teams: names });
    suppressRoundAnnounce = true;  // welcome covers round 1; don't talk over it
    newRoundWord();   // sets round banner + auto-advances to the Secret Word phase
    ensureAudio();
    window.scrollTo(0, 0);
  }

  function endGame() {
    stopPreroll();
    stopTimer();
    hideRollPrompt();
    if (synth) synth.cancel();   // silence the voice host when leaving the game
    pendingWinnerId = null;
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

  // ---- info bubbles (declutter) -------------------------------------------
  // Instructional text that only adds value once lives in data-info on a small
  // ⓘ button. Tap to toggle a popover; tap elsewhere or the button again closes.
  function initInfoBubbles() {
    var openPop = null;
    function closePop() {
      if (openPop) { openPop.remove(); openPop = null; }
    }
    document.addEventListener("click", function (e) {
      var btn = e.target.closest ? e.target.closest(".info-btn") : null;
      if (btn) {
        e.preventDefault();
        var wasOpenFor = openPop && openPop._owner === btn;
        closePop();
        if (wasOpenFor) return;
        var pop = document.createElement("div");
        pop.className = "info-pop";
        pop.setAttribute("role", "tooltip");
        pop.textContent = btn.getAttribute("data-info") || "";
        pop._owner = btn;
        btn.parentNode.insertBefore(pop, btn.nextSibling);
        openPop = pop;
        return;
      }
      if (openPop && !(e.target.closest && e.target.closest(".info-pop"))) closePop();
    });
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

    // Voice Host toggle (opt-in, default OFF, persisted in localStorage).
    loadHostPref();
    reflectHostBtn();
    var hb = $("hostBtn");
    if (hb) hb.addEventListener("click", toggleHost);

    // Secret Word pre-roll: Start Timer button -> 5..0 countdown -> reuse startTimer().
    var wst = $("wordStartTimer"); if (wst) wst.addEventListener("click", beginPreroll);
    var pc = $("prerollCancel"); if (pc) pc.addEventListener("click", cancelPreroll);

    // Info bubbles: ⓘ buttons reveal a one-time instructional tooltip on tap/click.
    initInfoBubbles();

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
