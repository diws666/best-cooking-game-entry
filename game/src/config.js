// Rush Hour Kitchen - every tuning number, colour and recipe in one place.
// Logical canvas is 1280x720; the renderer scales it to the window.
// All art is canvas-drawn shapes; nothing is borrowed.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** Seconds per shift. When the shift timer hits zero, it is game over. */
export const SHIFT_SECONDS = 180;

/** Colours: original, drawn with canvas only - no borrowed images. */
export const PALETTE = {
  wall: '#1e232c',
  counter: '#353b46',
  counterEdge: '#5c6676',
  board: '#262b35',
  boardEdge: '#7a8494',
  plate: '#e8e4d8',
  plateRim: '#8f876e',
  text: '#f5f3ec',
  muted: '#9aa3b1',
  highlight: '#ffd166',
  ok: '#4ade80',
  bad: '#fb7185',
  timerWarn: '#fbbf24',
  slotBg: '#161a22',
};

/** Ingredients: id -> { name, colour, key }. Keys 1-6 pick from the counter, left to right. */
export const INGREDIENTS = [
  { id: 'bun', name: 'Bun', colour: '#c9a227', key: 'Digit1' },
  { id: 'patty', name: 'Patty', colour: '#7a4a1c', key: 'Digit2' },
  { id: 'cheese', name: 'Cheese', colour: '#eab308', key: 'Digit3' },
  { id: 'lettuce', name: 'Lettuce', colour: '#65a30d', key: 'Digit4' },
  { id: 'tomato', name: 'Tomato', colour: '#dc2626', key: 'Digit5' },
  { id: 'topBun', name: 'Top bun', colour: '#a67c1e', key: 'Digit6' },
];

export const INGREDIENT_BY_ID = Object.fromEntries(
  INGREDIENTS.map((ing) => [ing.id, ing]),
);
export const INGREDIENT_BY_KEY = Object.fromEntries(
  INGREDIENTS.map((ing) => [ing.key, ing.id]),
);

/** Recipes: original rush-hour-themed names, nothing commercial. needs is a count per ingredient id. */
export const RECIPES = [
  { id: 'green-light', name: 'Green Light', needs: { bun: 1, lettuce: 1, tomato: 1, topBun: 1 }, points: 120, time: 16 },
  { id: 'yellow-light', name: 'Yellow Light', needs: { bun: 1, patty: 1, lettuce: 1, topBun: 1 }, points: 140, time: 15 },
  { id: 'red-light', name: 'Red Light', needs: { bun: 1, patty: 1, cheese: 1, topBun: 1 }, points: 160, time: 14 },
  { id: 'double-yellow', name: 'Double Yellow', needs: { bun: 1, patty: 2, cheese: 1, topBun: 1 }, points: 210, time: 16 },
  { id: 'cross-town', name: 'Cross-Town', needs: { bun: 1, patty: 1, cheese: 1, lettuce: 1, tomato: 1, topBun: 1 }, points: 280, time: 20 },
  { id: 'night-shift', name: 'Night Shift', needs: { bun: 1, patty: 2, topBun: 1 }, points: 180, time: 13 },
];

export const RECIPE_BY_ID = Object.fromEntries(
  RECIPES.map((r) => [r.id, r]),
);

/** Spawn: seconds between new orders, how fast it speeds up, the floor, and how many boards at once. */
export const SPAWN = { start: 5, perLevel: 0.3, min: 1.8, maxActive: 3 };

/** Plate: how many ingredients fit on the plate at once. */
export const PLATE_CAPACITY = 6;

/** Penalties. */
export const PENALTY = { wrongServe: 40, lateOrder: 30 };

/** Keys. */
export const KEY_SERVE = new Set(['Enter', ' ']);
export const KEY_CLEAR = 'Backspace';
export const KEY_RESTART = 'KeyR';
