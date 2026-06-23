const test = require("node:test");
const assert = require("node:assert");
const { hostLines } = require("../lib/host.js");

test("gameStart welcomes by name and explains the host", () => {
  const line = hostLines("gameStart", { teams: ["A", "B"] });
  assert.match(line, /Welcome to Sketch Fiesta!/);
  assert.match(line, /2 teams/);
  assert.match(line, /host/i);
});

test("newRound announces round, turn, and category but never the word", () => {
  const line = hostLines("newRound", {
    round: 3,
    teamName: "Team Coral",
    categoryLabel: "Animals · Animales",
    word: "Elephant" // a leaked secret word must NOT be spoken
  });
  assert.match(line, /Round 3/);
  assert.match(line, /Team Coral/);
  assert.match(line, /Animals/);
  assert.ok(!/Elephant/i.test(line), "secret word must never be spoken");
});

test("timerStart includes the seconds and timesUp prompts for the winner", () => {
  const start = hostLines("timerStart", { seconds: 60 });
  assert.match(start, /60 seconds/);
  const up = hostLines("timesUp", {});
  assert.match(up, /Time's up/);
});

test("scored and roll describe the team's progress", () => {
  const scored = hostLines("scored", { teamName: "Team Teal" });
  assert.match(scored, /Team Teal/);
  assert.match(scored, /first/i);

  const roll = hostLines("roll", { teamName: "Team Teal", roll: 4, tile: 7 });
  assert.match(roll, /Team Teal/);
  assert.match(roll, /4/);
  assert.match(roll, /tile 7/);
});

test("win celebrates the winner", () => {
  const line = hostLines("win", { teamName: "Team Sol" });
  assert.match(line, /Team Sol/);
  assert.match(line, /wins/i);
});

test("the secret word is never spoken across ANY event, even if leaked into state", () => {
  const SECRET = "Pineapple";
  const events = ["gameStart", "newRound", "timerStart", "timesUp", "scored", "roll", "win"];
  for (const ev of events) {
    const line = hostLines(ev, {
      teams: ["X", "Y"], round: 1, teamName: "Team X",
      categoryLabel: "Food", seconds: 30, roll: 3, tile: 5,
      word: SECRET, en: SECRET, es: "Piña", secret: SECRET
    });
    assert.ok(!line.includes(SECRET), `${ev} leaked the secret word`);
    assert.ok(!line.includes("Piña"), `${ev} leaked the ES secret word`);
  }
});

test("edge cases: missing fields produce a clean line, unknown event is empty", () => {
  // No teamName / category / round — must not say 'undefined' or be blank.
  const line = hostLines("newRound", {});
  assert.ok(line.length > 0);
  assert.ok(!/undefined|null|NaN/.test(line));

  // Missing seconds -> still a usable timer line.
  const t = hostLines("timerStart", {});
  assert.ok(t.length > 0 && !/undefined/.test(t));

  // No state object at all must not throw.
  assert.doesNotThrow(() => hostLines("timesUp"));

  // Unknown event -> empty string (caller says nothing).
  assert.strictEqual(hostLines("bogus", { teamName: "Z" }), "");
  assert.strictEqual(hostLines(undefined, {}), "");
});

test("output is deterministic and trimmed (pure function, no random/Date/DOM)", () => {
  const a = hostLines("newRound", { round: 2, teamName: "T", categoryLabel: "C" });
  const b = hostLines("newRound", { round: 2, teamName: "T", categoryLabel: "C" });
  assert.strictEqual(a, b);
  assert.strictEqual(a, a.trim());
  assert.ok(!/\s{2,}/.test(a), "no double spaces");
});
