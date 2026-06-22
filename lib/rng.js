// Seedable deterministic PRNG (mulberry32). Same seed -> identical sequence,
// so dice/board outcomes are fully deterministic under test. Pure, no globals.
function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function rollDie(rng, sides) { sides = sides || 6; return 1 + Math.floor(rng() * sides); }
if (typeof module !== "undefined" && module.exports) module.exports = { makeRng, rollDie };
else if (typeof window !== "undefined") window.GameRng = { makeRng, rollDie };
