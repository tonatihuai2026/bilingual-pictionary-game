// Sketch Fiesta — Voice Host clip-key sequencer (PURE, deterministic).
//
// The pre-rendered neural Voice Host (Amy/Piper) plays bundled .m4a fragments
// in sequence instead of browser TTS. This module maps a game EVENT + a plain
// state snapshot to the ORDERED list of clip keys to play — mirroring the
// sentence assembly in lib/host.js exactly — with no Date, no random, no DOM,
// so it is fully unit-testable and identical for a given input.
//
//   voiceKeys(event, state) -> string[]   (clip keys, in play order)
//
// Keys resolve to files via site/voice/manifest.json (key -> {file, text}).
// Unknown events return [] (caller plays nothing). When a needed clip cannot
// exist (a number/seconds value outside the rendered set), the clause is
// DROPPED rather than glued from an unavailable clip — mirroring host.js, which
// also omits empty clauses. The caller still has the SpeechSynthesis fallback.
//
// HARD RULE: never voice the secret word. Keys are fixed (phrases, numbers,
// colours, seconds, CATEGORY labels) — `state.word` is never read; there is no
// key that encodes a drawn word.
//
// Team identity: the spoken host refers to teams by a fixed COLOUR keyed by team
// index, mirroring the on-screen TOKEN_COLORS order in app.js
//   [coral, teal, gold, purple] -> [orange, green, yellow, purple].
// The typed team name is never spoken (it is arbitrary user text, un-renderable).

(function () {
  "use strict";

  // team index -> colour clip key, mirroring app.js TOKEN_COLORS order.
  var TEAM_COLOR_KEYS = ["orange", "green", "yellow", "purple"];
  // seconds values we actually rendered a clip for.
  var SECONDS_PRESETS = { 30: 1, 45: 1, 60: 1, 90: 1, 120: 1 };
  var MAX_NUM = 30; // num:0 .. num:30 rendered

  // Shared slug (identical to scripts/render-voice.sh) so a label maps to its
  // cat:<slug> key consistently across render, app, and tests.
  function slug(s) {
    return String(s == null ? "" : s)
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  // categoryLabel() in app.js returns "English · Español"; the clip is keyed by
  // the English label only. Take the half before the middot separator.
  function catKeyFromLabel(label) {
    var en = String(label == null ? "" : label).split("·")[0];
    var s = slug(en);
    return s ? ("cat:" + s) : null;
  }

  // Resolve a team to its colour key by index; fall back to a generic identity
  // key that mirrors the host.js text fallback for that event.
  function teamKey(state, fallback) {
    var i = parseInt(state && state.teamIndex, 10);
    if (!isNaN(i) && i >= 0 && i < TEAM_COLOR_KEYS.length) {
      return "team:" + TEAM_COLOR_KEYS[i];
    }
    return fallback; // e.g. team:next / team:a / team:the
  }

  function numKey(n) {
    var v = parseInt(n, 10);
    return (!isNaN(v) && v >= 0 && v <= MAX_NUM) ? ("num:" + v) : null;
  }

  function voiceKeys(event, state) {
    state = state || {};
    var k = [];

    switch (event) {
      case "gameStart": {
        k.push("gs.welcome");
        var teams = Array.isArray(state.teams) ? state.teams.length : 0;
        if (teams >= 2) k.push("gs.teamsReady");
        return k;
      }

      case "newRound": {
        var rn = numKey(state.round);
        if (parseInt(state.round, 10) > 0 && rn) { k.push("nr.round", rn); }
        k.push(teamKey(state, "team:next"));
        k.push("nr.yourTurn");
        var ck = catKeyFromLabel(state.categoryLabel);
        if (ck) { k.push("nr.categoryIs", ck); }
        k.push("nr.drawerReveal");
        return k;
      }

      case "timerStart": {
        k.push("ts.timesRunning");
        var secs = parseInt(state.seconds, 10);
        if (secs > 0 && SECONDS_PRESETS[secs]) {
          k.push("ts.youHave", "sec:" + secs, "ts.seconds");
        }
        k.push("ts.startDrawing");
        return k;
      }

      case "timesUp":
        return ["tu.timesUp"];

      case "scored":
        return [teamKey(state, "team:a"), "sc.guessedFirst"];

      case "roll": {
        k.push(teamKey(state, "team:the"), "rl.rolledA");
        var rk = numKey(state.roll);
        if (parseInt(state.roll, 10) > 0 && rk) k.push(rk);
        var tk = numKey(state.tile);
        if (tk && parseInt(state.tile, 10) >= 0) { k.push("rl.movedToTile", tk); }
        else { k.push("rl.movedForward"); }
        return k;
      }

      case "win":
        return [teamKey(state, "team:a"), "wn.reachesWins"];

      default:
        return [];
    }
  }

  var API = { voiceKeys: voiceKeys, slug: slug, catKeyFromLabel: catKeyFromLabel,
              TEAM_COLOR_KEYS: TEAM_COLOR_KEYS };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else if (typeof window !== "undefined") window.GameVoiceKeys = API;
})();
