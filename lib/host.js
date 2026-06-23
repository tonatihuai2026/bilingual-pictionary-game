// Sketch Fiesta — Voice Host lines (PURE, deterministic). Catalyst Gather's
// voice-assisted-multiplayer wedge: the co-located board narrates the game out
// loud via the browser Web Speech API. This module maps a game EVENT + a plain
// state snapshot to the spoken text — no Date, no random, no DOM — so it is
// fully unit-testable and identical for a given input.
//
//   hostLines(event, state) -> string   (one short line, EN-first, host voice)
//
// HARD RULE: never speak the secret word. The drawer reads it privately on the
// device; the host only ever announces the CATEGORY. `state.word` is ignored on
// purpose and a guard strips it if a caller ever leaks it into a field we use.
//
// Recognised events:
//   gameStart   — welcome + how it works            (state: {teams?})
//   newRound    — round number + whose turn + category
//                 (state: {round?, teamName?, categoryLabel?})
//   timerStart  — drawing has begun, clock running   (state: {seconds?})
//   timesUp     — round timer hit zero               (state: {})
//   scored      — a team guessed first                (state: {teamName?})
//   roll        — dice result + where the token moved (state: {teamName?, roll?, tile?})
//   win         — a team reached the finish           (state: {teamName?})
//
// Unknown events return "" (caller treats empty string as "say nothing").

(function () {
  "use strict";

  // Collapse whitespace and trim so callers get one clean utterance.
  function clean(s) {
    return String(s == null ? "" : s).replace(/\s+/g, " ").trim();
  }

  // Fall back to a generic noun when a name/label is missing or blank, so the
  // host never speaks "undefined" or an empty gap.
  function or(value, fallback) {
    var v = clean(value);
    return v ? v : fallback;
  }

  function hostLines(event, state) {
    state = state || {};

    switch (event) {
      case "gameStart": {
        var teams = Array.isArray(state.teams) ? state.teams.length : 0;
        var who = teams >= 2 ? (teams + " teams, get ready! ") : "";
        return clean(
          "Welcome to Sketch Fiesta! " + who +
          "I'm your host. I'll call the turns, read the category, and keep the time. " +
          "The drawer keeps the secret word to themselves."
        );
      }

      case "newRound": {
        var round = parseInt(state.round, 10);
        var roundPart = (round > 0) ? ("Round " + round + ". ") : "";
        var team = or(state.teamName, "the next team");
        var cat = or(state.categoryLabel, "");
        // Announce the CATEGORY only — never the secret word.
        var catPart = cat ? (" The category is " + cat + ".") : "";
        return clean(
          roundPart + team + ", it's your turn." + catPart +
          " Drawer, take the device and reveal your word."
        );
      }

      case "timerStart": {
        var secs = parseInt(state.seconds, 10);
        var secPart = (secs > 0)
          ? ("You have " + secs + " seconds. ")
          : "";
        return clean("Time's running! " + secPart + "Start drawing!");
      }

      case "timesUp":
        return clean("Time's up! Pencils down. Who guessed it first?");

      case "scored": {
        var scorer = or(state.teamName, "A team");
        return clean(scorer + " guessed it first! Roll the dice to move.");
      }

      case "roll": {
        var roller = or(state.teamName, "The team");
        var roll = parseInt(state.roll, 10);
        var rollPart = (roll > 0) ? (" rolled a " + roll) : " rolled";
        var tile = parseInt(state.tile, 10);
        var tilePart = (!isNaN(tile) && tile >= 0)
          ? (" and moved to tile " + tile + "!")
          : " and moved forward!";
        return clean(roller + rollPart + tilePart);
      }

      case "win": {
        var winner = or(state.teamName, "A team");
        return clean(
          winner + " reaches the finish and wins! " +
          "Fiesta! Great game, everyone."
        );
      }

      default:
        return "";
    }
  }

  var API = { hostLines: hostLines };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else if (typeof window !== "undefined") window.GameHost = API;
})();
