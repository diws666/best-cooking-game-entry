// Rush Hour Kitchen - the one loop and the screens.
// Input is read every frame, the world advances in fixed 1/60 s steps, and the
// renderer paints what is there. Screens: title, play, game over.
// ?shot=start|play|serve|end stages a scene and sets window.__shotReady so the
// screenshot helper can grab a clean, deterministic frame.

import { STEP, SHIFT_SECONDS, SPAWN, PENALTY, INGREDIENT_BY_KEY, RECIPES } from './config.js';
import { createRandom } from './random.js';
import { createOrderBoard } from './orders.js';
import { createPlate, add, clear, plateCounts } from './plate.js';
import { ACTION_CONFIRM, ACTION_CLEAR, ACTION_RESTART, createInput } from './input.js';
import { createRenderer } from './render.js';
import { sound } from './sound.js';

const MAX_FRAME = 0.25;
const BEST_KEY = 'rush-hour-kitchen.best';
const RECIPE_BY_ID = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const renderer = createRenderer(canvas);
const input = createInput(canvas);
input.bounding();
window.addEventListener('resize', () => input.bounding());

function readBest() {
  try {
    return Math.max(0, Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0);
  } catch {
    return 0;
  }
}
let best = readBest();

let screen = 'title';
let state = null;
let board = null;
let accumulator = 0;
let last = performance.now();

function newState() {
  return {
    timeLeft: SHIFT_SECONDS,
    score: 0,
    served: 0,
    level: 1,
    plate: createPlate(),
    orders: [],
    message: '',
    messageTimer: 0,
    lastPicked: null,
  };
}

function announce(msg) {
  state.message = msg;
  state.messageTimer = 3;
  status.textContent = msg;
}

function startGame() {
  state = newState();
  board = createOrderBoard({ rng: createRandom(Date.now()), now: () => performance.now() });
  screen = 'play';
  last = performance.now();
  announce('Shift starts. Watch the board.');
}

function endGame() {
  screen = 'gameover';
  if (state.score > best) {
    best = state.score;
    try {
      window.localStorage.setItem(BEST_KEY, String(best));
    } catch {
      // Storage off: best lasts this visit only.
    }
  }
  announce(`Shift over. Score ${state.score}. Best ${best}.`);
  sound.gameOver();
}

function attemptServe() {
  if (state.plate.stack.length === 0) return;
  const order = board.serve(plateCounts(state.plate.stack));
  if (order) {
    state.score += order.points;
    state.served += 1;
    state.level = 1 + Math.floor(state.score / 400);
    clear(state.plate);
    announce(`Served ${order.name}! +${order.points}`);
    sound.serve();
  } else {
    state.score = Math.max(0, state.score - PENALTY.wrongServe);
    clear(state.plate);
    announce(`Wrong order! -${PENALTY.wrongServe}`);
    sound.wrong();
  }
}

function step(dt) {
  if (screen !== 'play') {
    const ev = input.takeActions();
    if ((ev.actions & ACTION_CONFIRM) || ev.click || (ev.actions & ACTION_RESTART)) startGame();
    return;
  }
  state.timeLeft -= dt;
  state.level = 1 + Math.floor(state.score / 400);
  const spawned = board.update(dt, state.level);
  if (spawned) {
    announce(`New order: ${spawned.name}`);
    sound.spawn();
  }
  for (const order of board.orders) {
    if (order.expired && !order.counted) {
      order.counted = true;
      state.score = Math.max(0, state.score - PENALTY.lateOrder);
      announce(`${order.name} expired -${PENALTY.lateOrder}`);
      sound.wrong();
    }
  }
  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    endGame();
    return;
  }
  if (state.messageTimer > 0) state.messageTimer -= dt;

  const ev = input.takeActions();
  if (ev.actions & ACTION_CONFIRM) attemptServe();
  if (ev.actions & ACTION_CLEAR) {
    clear(state.plate);
    announce('Plate cleared.');
    sound.pick();
  }
  if (ev.ingredient) {
    const id = INGREDIENT_BY_KEY[ev.ingredient];
    if (id && add(state.plate, id)) {
      state.lastPicked = { id, t: Date.now() };
      sound.pick();
    }
  }
  if (ev.click) {
    const hit = renderer.hitTest(ev.click.x, ev.click.y);
    if (hit) {
      if (hit.kind === 'ingredient') {
        if (add(state.plate, hit.id)) {
          state.lastPicked = { id: hit.id, t: Date.now() };
          sound.pick();
        }
      } else if (hit.kind === 'serve') {
        attemptServe();
      }
    }
  }
}

function frame(now) {
  requestAnimationFrame(frame);
  accumulator += Math.min((now - last) / 1000, MAX_FRAME);
  last = now;
  step(STEP);                       // input is read on every screen (title, play, game over)
  while (accumulator >= STEP && screen === 'play') {
    step(STEP);
    accumulator -= STEP;
  }
  if (screen === 'play') {
    state.messageTimer -= accumulator;
    state.orders = board.orders;
  }
  renderer.draw(screen, state);
}

function makeOrder(recipeId, timeLeft) {
  const recipe = RECIPE_BY_ID[recipeId];
  return {
    id: Math.floor(Math.random() * 10000),
    recipeId: recipe.id,
    name: recipe.name,
    needs: recipe.needs,
    points: recipe.points,
    time: recipe.time,
    timeLeft,
    expired: false,
    served: false,
  };
}

function runShot(name) {
  state = newState();
  screen = 'play';
  state.score = 840;
  state.served = 6;
  state.level = 3;
  state.timeLeft = 112;

  if (name === 'start') {
    screen = 'title';
  } else if (name === 'cover') {
    // Cover: full kitchen, order board, ingredients, timer, plate mid-assembly.
    state.orders = [
      makeOrder('red-light', 9),
      makeOrder('yellow-light', 4),
      makeOrder('green-light', 14),
    ];
    add(state.plate, 'bun');
    add(state.plate, 'patty');
    state.message = "Yellow Light's about to expire - plate's half built.";
    state.messageTimer = 9;
  } else if (name === 'play') {
    // Mid-shift, a different moment: plate further along, clock lower.
    state.orders = [
      makeOrder('cross-town', 6),
      makeOrder('night-shift', 13),
    ];
    add(state.plate, 'bun');
    add(state.plate, 'patty');
    add(state.plate, 'cheese');
    state.score = 1120;
    state.served = 8;
    state.timeLeft = 61;
    state.message = 'Cross-Town needs the lot - keep stacking.';
    state.messageTimer = 9;
  } else if (name === 'serve') {
    // Plate complete, matching the first ticket, ready to serve.
    state.orders = [
      makeOrder('red-light', 11),
      makeOrder('cross-town', 6),
    ];
    add(state.plate, 'bun');
    add(state.plate, 'patty');
    add(state.plate, 'cheese');
    add(state.plate, 'topBun');
    state.message = 'Red Light complete - serve it.';
    state.messageTimer = 9;
  } else if (name === 'end') {
    screen = 'gameover';
    state.score = 1420;
    state.served = 9;
    state.best = 1420;
  }

  let painted = 0;
  function paint() {
    renderer.draw(screen, state);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

if (shot) {
  runShot(shot);
} else if (params.get('debug') === '1') {
  window.__rushDebug = { getScreen: () => screen, getState: () => state, getBoard: () => board };
  requestAnimationFrame(frame);
} else {
  startGame();
  requestAnimationFrame(frame);
}
