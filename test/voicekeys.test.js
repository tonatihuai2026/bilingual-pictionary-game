const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const { voiceKeys, slug, catKeyFromLabel } = require("../lib/voicekeys.js");

// The generated clip manifest is the source of truth for which keys exist.
const manifest = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "voice", "manifest.json"), "utf8")
);
const KEYS = new Set(Object.keys(manifest).filter((k) => !k.startsWith("_")));

function assertAllReal(keys) {
  for (const k of keys) {
    assert.ok(KEYS.has(k), `key "${k}" has no clip in voice/manifest.json`);
    assert.ok(fs.existsSync(path.join(__dirname, "..", "voice", manifest[k].file)),
      `clip file missing for "${k}"`);
  }
}

test("gameStart: welcome, + teamsReady only when >=2 teams", () => {
  assert.deepStrictEqual(voiceKeys("gameStart", { teams: ["A", "B"] }),
    ["gs.welcome", "gs.teamsReady"]);
  assert.deepStrictEqual(voiceKeys("gameStart", { teams: ["A"] }), ["gs.welcome"]);
  assertAllReal(voiceKeys("gameStart", { teams: ["A", "B"] }));
});

test("newRound: round#, team colour, turn, category, drawer reveal — never the word", () => {
  const seq = voiceKeys("newRound", {
    round: 3, teamIndex: 0, categoryLabel: "Animals · Animales", word: "Elephant",
  });
  assert.deepStrictEqual(seq,
    ["nr.round", "num:3", "team:orange", "nr.yourTurn", "nr.categoryIs", "cat:animals", "nr.drawerReveal"]);
  assert.ok(!seq.some((k) => /elephant/i.test(k)), "secret word must never appear as a key");
  assertAllReal(seq);
});

test("newRound: unknown team index -> team:next fallback; no category -> clause dropped", () => {
  const seq = voiceKeys("newRound", { round: 1, teamIndex: 9 });
  assert.deepStrictEqual(seq, ["nr.round", "num:1", "team:next", "nr.yourTurn", "nr.drawerReveal"]);
  assertAllReal(seq);
});

test("newRound: '&' category label maps to the rendered slug", () => {
  assert.strictEqual(catKeyFromLabel("Colors & Shapes · Colores y formas"), "cat:colors-shapes");
  const seq = voiceKeys("newRound", { teamIndex: 1, categoryLabel: "Colors & Shapes · Colores y formas" });
  assert.ok(seq.includes("cat:colors-shapes"));
  assertAllReal(seq);
});

test("timerStart: preset seconds included; non-preset dropped (no glued number)", () => {
  assert.deepStrictEqual(voiceKeys("timerStart", { seconds: 60 }),
    ["ts.timesRunning", "ts.youHave", "sec:60", "ts.seconds", "ts.startDrawing"]);
  assert.deepStrictEqual(voiceKeys("timerStart", { seconds: 75 }),
    ["ts.timesRunning", "ts.startDrawing"]);
  assertAllReal(voiceKeys("timerStart", { seconds: 60 }));
});

test("timesUp / scored", () => {
  assert.deepStrictEqual(voiceKeys("timesUp", {}), ["tu.timesUp"]);
  assert.deepStrictEqual(voiceKeys("scored", { teamIndex: 2 }), ["team:yellow", "sc.guessedFirst"]);
  assert.deepStrictEqual(voiceKeys("scored", {}), ["team:a", "sc.guessedFirst"]);
  assertAllReal(voiceKeys("scored", { teamIndex: 2 }));
});

test("roll: team, rolled a, number, moved to tile + number", () => {
  const seq = voiceKeys("roll", { teamIndex: 3, roll: 4, tile: 7 });
  assert.deepStrictEqual(seq, ["team:purple", "rl.rolledA", "num:4", "rl.movedToTile", "num:7"]);
  assertAllReal(seq);
  // missing/invalid tile -> movedForward fallback
  assert.deepStrictEqual(voiceKeys("roll", { teamIndex: 0, roll: 2 }),
    ["team:orange", "rl.rolledA", "num:2", "rl.movedForward"]);
});

test("win: team colour + reaches/wins", () => {
  const seq = voiceKeys("win", { teamIndex: 1 });
  assert.deepStrictEqual(seq, ["team:green", "wn.reachesWins"]);
  assertAllReal(seq);
});

test("unknown event -> empty list (say nothing)", () => {
  assert.deepStrictEqual(voiceKeys("nope", {}), []);
});

test("every clip in the manifest has its backing file on disk", () => {
  for (const k of KEYS) {
    assert.ok(fs.existsSync(path.join(__dirname, "..", "voice", manifest[k].file)),
      `manifest key "${k}" -> missing file ${manifest[k].file}`);
  }
});
