// Sketch Fiesta — turn-flow logic (pure, deterministic). Investor rule: on an all-play
// tile every team plays; the FIRST team to correctly guess the word gets to roll the
// dice and advance. Depends on game.js + rng.js (node require or browser globals).
var G = (typeof require !== "undefined") ? require("./game.js") : (typeof window !== "undefined" ? window.GameCore : null);
var R = (typeof require !== "undefined") ? require("./rng.js")  : (typeof window !== "undefined" ? window.GameRng  : null);

function initGame(teamNames, size, complexity, rng) {
  return {
    board: G.makeBoard(size, complexity, rng),
    teams: teamNames.map(function (n, i) { return { id: i, name: n, pos: 0 }; }),
    winner: null
  };
}

// The team that guessed first rolls and advances. Returns a NEW state plus {roll, won}.
// No-op once a winner exists.
function resolveGuess(state, teamId, rng) {
  if (state.winner !== null && state.winner !== undefined) {
    return { state: state, roll: 0, won: false, over: true };
  }
  var size = state.board.length;
  var roll = R.rollDie(rng, 6);
  var teams = state.teams.map(function (t) {
    if (t.id !== teamId) return { id: t.id, name: t.name, pos: t.pos };
    return { id: t.id, name: t.name, pos: G.advance(t.pos, roll, size) };
  });
  var moved = teams.filter(function (t) { return t.id === teamId; })[0];
  var won = !!moved && G.hasWon(moved.pos, size);
  return { state: { board: state.board, teams: teams, winner: won ? teamId : null }, roll: roll, won: won };
}

var API = { initGame: initGame, resolveGuess: resolveGuess };
if (typeof module !== "undefined" && module.exports) module.exports = API;
else if (typeof window !== "undefined") window.GameTurn = API;
