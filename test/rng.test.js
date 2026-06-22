const test = require("node:test");
const assert = require("node:assert");
const { makeRng, rollDie } = require("../lib/rng.js");

test("same seed -> identical sequence (deterministic)", () => {
  const a = makeRng(42), b = makeRng(42);
  assert.deepStrictEqual([a(), a(), a()], [b(), b(), b()]);
});
test("different seeds -> different sequence", () => {
  const a = makeRng(1), b = makeRng(2);
  assert.notDeepStrictEqual([a(), a(), a()], [b(), b(), b()]);
});
test("rollDie stays in [1,sides] and is deterministic per seed", () => {
  const r = makeRng(7);
  for (let i = 0; i < 200; i++) { const d = rollDie(r, 6); assert.ok(d >= 1 && d <= 6, "in range"); }
  assert.strictEqual(rollDie(makeRng(7)), rollDie(makeRng(7)));
});
