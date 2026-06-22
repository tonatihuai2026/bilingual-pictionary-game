const test = require("node:test");
const assert = require("node:assert");
const { makeRng } = require("../lib/rng.js");
const { initGame, resolveGuess } = require("../lib/turn.js");

test("initGame: board sized, teams at start, no winner", () => {
  const g = initGame(["A", "B"], 12, "medium", makeRng(3));
  assert.strictEqual(g.board.length, 12);
  assert.deepStrictEqual(g.teams.map(t => t.pos), [0, 0]);
  assert.strictEqual(g.winner, null);
});

test("resolveGuess is deterministic for a seed and only moves the guesser", () => {
  const g = initGame(["A", "B", "C"], 20, "easy", makeRng(5));
  const r1 = resolveGuess(g, 1, makeRng(5));
  const r2 = resolveGuess(g, 1, makeRng(5));
  assert.strictEqual(r1.roll, r2.roll);
  assert.deepStrictEqual(r1.state.teams.map(t => t.pos), r2.state.teams.map(t => t.pos));
  // only team 1 moved
  assert.strictEqual(r1.state.teams[0].pos, 0);
  assert.strictEqual(r1.state.teams[2].pos, 0);
  assert.strictEqual(r1.state.teams[1].pos, r1.roll);
  // input state not mutated
  assert.strictEqual(g.teams[1].pos, 0);
});

test("resolveGuess sets winner when a team reaches the finish", () => {
  let g = initGame(["A", "B"], 4, "easy", makeRng(2)); // small board: finish at index 3
  let st = g, guard = 0, lastWon = false;
  while (st.winner === null && guard++ < 50) {
    const r = resolveGuess(st, 0, makeRng(guard)); // team A keeps guessing first
    st = r.state; lastWon = r.won;
  }
  assert.strictEqual(st.winner, 0);
  assert.ok(st.teams[0].pos >= 3);
});

test("resolveGuess is a no-op once a winner exists", () => {
  const won = { board: [{},{},{}], teams: [{id:0,name:"A",pos:2},{id:1,name:"B",pos:0}], winner: 0 };
  const r = resolveGuess(won, 1, makeRng(9));
  assert.strictEqual(r.over, true);
  assert.strictEqual(r.state.winner, 0);
  assert.strictEqual(r.state.teams[1].pos, 0);
});
