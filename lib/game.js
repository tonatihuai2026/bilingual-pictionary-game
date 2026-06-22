// Sketch Fiesta — pure, deterministic board-game logic (no DOM, no globals).
// Tested via node:test; mirrored to window for the browser build.

// Tile categories scale with the chosen complexity level (investor requirement).
var CATEGORIES_BY_COMPLEXITY = {
  easy:   ["animals", "food", "objects"],
  medium: ["animals", "food", "objects", "actions", "places"],
  hard:   ["animals", "food", "objects", "actions", "places", "abstract", "idioms"]
};

function categoriesFor(complexity) {
  return CATEGORIES_BY_COMPLEXITY[complexity] || CATEGORIES_BY_COMPLEXITY.easy;
}

// Build a linear board of `size` tiles: index 0 = start, last = finish, middle =
// "all-play" tiles each tagged with a category drawn deterministically from the
// complexity's category set (rng is a seedable function returning [0,1)).
function makeBoard(size, complexity, rng) {
  if (size < 2) throw new Error("board size must be >= 2");
  var cats = categoriesFor(complexity);
  var board = [];
  for (var i = 0; i < size; i++) {
    if (i === 0) board.push({ index: i, type: "start" });
    else if (i === size - 1) board.push({ index: i, type: "finish" });
    else board.push({ index: i, type: "all-play", category: cats[Math.floor(rng() * cats.length)] });
  }
  return board;
}

// Move a team `steps` forward, clamped to the finish (no overshoot past the board).
function advance(pos, steps, size) {
  if (steps < 0) steps = 0;
  var np = pos + steps;
  return np >= size - 1 ? size - 1 : np;
}

// A team wins when it reaches (or passes) the finish tile.
function hasWon(pos, size) { return pos >= size - 1; }

var API = { categoriesFor: categoriesFor, makeBoard: makeBoard, advance: advance, hasWon: hasWon,
            CATEGORIES_BY_COMPLEXITY: CATEGORIES_BY_COMPLEXITY };
if (typeof module !== "undefined" && module.exports) module.exports = API;
else if (typeof window !== "undefined") window.GameCore = API;
