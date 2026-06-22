const test = require("node:test");
const assert = require("node:assert");
const { makeRng } = require("../lib/rng.js");
const { categoriesFor, makeBoard, advance, hasWon, CATEGORIES_BY_COMPLEXITY } = require("../lib/game.js");

test("categoriesFor scales with complexity; unknown -> easy", () => {
  assert.strictEqual(categoriesFor("easy").length, 3);
  assert.strictEqual(categoriesFor("medium").length, 5);
  assert.strictEqual(categoriesFor("hard").length, 7);
  assert.deepStrictEqual(categoriesFor("???"), CATEGORIES_BY_COMPLEXITY.easy);
});

test("makeBoard: size, start/finish, middle tiles all-play w/ valid category", () => {
  const b = makeBoard(10, "medium", makeRng(1));
  assert.strictEqual(b.length, 10);
  assert.strictEqual(b[0].type, "start");
  assert.strictEqual(b[9].type, "finish");
  const cats = categoriesFor("medium");
  for (let i = 1; i < 9; i++) {
    assert.strictEqual(b[i].type, "all-play");
    assert.ok(cats.includes(b[i].category), "category from set");
  }
});

test("makeBoard is deterministic for a given seed", () => {
  assert.deepStrictEqual(makeBoard(12, "hard", makeRng(99)), makeBoard(12, "hard", makeRng(99)));
});

test("makeBoard throws on size < 2", () => {
  assert.throws(() => makeBoard(1, "easy", makeRng(1)));
});

test("advance clamps to finish, never overshoots, floors negatives", () => {
  assert.strictEqual(advance(0, 3, 10), 3);
  assert.strictEqual(advance(8, 5, 10), 9);   // clamp to finish (index 9)
  assert.strictEqual(advance(9, 2, 10), 9);   // already at finish
  assert.strictEqual(advance(5, -4, 10), 5);  // negative steps -> no move
});

test("hasWon true only at/after finish", () => {
  assert.strictEqual(hasWon(8, 10), false);
  assert.strictEqual(hasWon(9, 10), true);
});
