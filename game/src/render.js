// Renderer: draws the kitchen, the counter, the order board, the plate and the
// screens. One job only - pixels, no game logic. Logical canvas is 1280x720,
// scaled letterboxed to the window so screenshots stay 1:1.

import { INGREDIENTS, INGREDIENT_BY_ID, PALETTE, PLATE_CAPACITY } from './config.js';

const W = 1280;
const H = 720;
const BIN_X = 20;
const BIN_W = 240;
const BIN_H = 70;
const BIN_GAP = 10;
const BIN_START_Y = 120;
const BOARD_X = 980;
const BOARD_W = 280;
const BOARD_START_Y = 130;
const TICKET_H = 116;
const TICKET_GAP = 10;
const PLATE_X = 600;
const PLATE_Y = 450;

let scale = 1;
let offsetX = 0;
let offsetY = 0;

// Last frame's layout, in logical coordinates, for hit testing.
const layout = { bins: [], serve: null };

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function setSize(cssWidth, cssHeight) {
    scale = Math.min(cssWidth / W, cssHeight / H);
    offsetX = (cssWidth - W * scale) / 2;
    offsetY = (cssHeight - H * scale) / 2;
    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function fill(x, y, w, h, r, color) {
    ctx.save();
    ctx.fillStyle = color;
    roundRect(x, y, w, h, r);
    ctx.fill();
    ctx.restore();
  }

  function stroke(x, y, w, h, r, color, width = 2) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    roundRect(x, y, w, h, r);
    ctx.stroke();
    ctx.restore();
  }

  function text(str, x, y, size, color, align = 'center') {
    ctx.save();
    ctx.font = `${size}px system-ui, -apple-system, "Segoe UI", sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(str, x, y);
    ctx.restore();
  }

  function ingredientIcon(id, x, y, size) {
    const ing = INGREDIENT_BY_ID[id];
    if (!ing) return;
    ctx.save();
    ctx.fillStyle = ing.colour;
    roundRect(x - size / 2, y - size / 2, size, size, size / 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  function drawCounter(state) {
    const picked = state.lastPicked && Date.now() - state.lastPicked.t < 300 ? state.lastPicked.id : null;
    for (let i = 0; i < INGREDIENTS.length; i++) {
      const ing = INGREDIENTS[i];
      const x = BIN_X;
      const y = BIN_START_Y + i * (BIN_H + BIN_GAP);
      layout.bins[i] = { x, y, w: BIN_W, h: BIN_H, id: ing.id };
      const hot = picked === ing.id;
      fill(x, y, BIN_W, BIN_H, 8, PALETTE.counter);
      stroke(x, y, BIN_W, BIN_H, 8, hot ? PALETTE.highlight : PALETTE.counterEdge, hot ? 3 : 2);
      ctx.save();
      ctx.fillStyle = ing.colour;
      roundRect(x + 26, y + 10, 52, 52, 10);
      ctx.fill();
      ctx.restore();
      text(ing.name, x + 96, y + BIN_H / 2, 19, PALETTE.text, 'left');
      text(String(i + 1), x + BIN_W - 30, y + 22, 20, hot ? PALETTE.highlight : PALETTE.muted, 'center');
    }
  }

  function drawBoard(orders) {
    let y = BOARD_START_Y;
    text('ORDERS', BOARD_X + BOARD_W / 2, y - 8, 20, PALETTE.highlight, 'center');
    y += 22;
    for (const order of orders) {
      const x = BOARD_X;
      const w = BOARD_W;
      const h = TICKET_H;
      const rect = { x, y, w, h, id: order.id };
      if (!layout.boardTickets) layout.boardTickets = [];
      layout.boardTickets.push(rect);
      const share = order.time > 0 ? Math.max(0, Math.min(1, order.timeLeft / order.time)) : 0;
      const expired = order.expired;
      const served = order.served;
      const alpha = served || expired ? 0.45 : 1;
      ctx.save();
      ctx.globalAlpha = alpha;
      fill(x, y, w, h, 8, PALETTE.board);
      stroke(x, y, w, h, 8, PALETTE.boardEdge, 2);
      // countdown ring
      ctx.beginPath();
      ctx.arc(x + w - 34, y + h / 2, 26, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * share);
      ctx.strokeStyle = share < 0.33 ? PALETTE.bad : PALETTE.highlight;
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath();
      ctx.arc(x + w - 34, y + h / 2, 26, 0, 2 * Math.PI);
      ctx.stroke();
      // name
      ctx.fillStyle = PALETTE.text;
      ctx.font = 'bold 15px system-ui, -apple-system, "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(order.name, x + 14, y + 22);
      // needs icons
      let ix = x + 14;
      for (const [id, n] of Object.entries(order.needs)) {
        for (let k = 0; k < n; k++) {
          ingredientIcon(id, ix + 14, y + 48, 22);
          ix += 26;
        }
        ix += 8;
      }
      // time and points
      ctx.textAlign = 'right';
      const secs = Math.ceil(Math.max(0, order.timeLeft));
      ctx.fillStyle = secs < 6 ? PALETTE.bad : PALETTE.text;
      ctx.font = 'bold 20px system-ui, -apple-system, "Segoe UI", sans-serif';
      ctx.fillText(`${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`, x + w - 46, y + 36);
      ctx.fillStyle = PALETTE.muted;
      ctx.font = '14px system-ui, -apple-system, "Segoe UI", sans-serif';
      ctx.fillText(`+${order.points}`, x + w - 46, y + 64);
      ctx.restore();
      y += h + TICKET_GAP;
    }
    if (orders.length === 0) {
      text('Board clear.', BOARD_X + BOARD_W / 2, BOARD_START_Y + 40, 16, PALETTE.muted, 'center');
    }
  }

  function drawPlate(state, current) {
    // order ticket
    const tx = 340;
    const ty = 130;
    const tw = 520;
    const th = 110;
    fill(tx, ty, tw, th, 10, PALETTE.board);
    stroke(tx, ty, tw, th, 10, PALETTE.boardEdge, 2);
    if (current) {
      text(current.name, tx + 22, ty + 26, 22, PALETTE.highlight, 'left');
      text("Today's ticket:", tx + 22, ty + 56, 14, PALETTE.muted, 'left');
      let ix = tx + 22;
      for (const [id, n] of Object.entries(current.needs)) {
        ingredientIcon(id, ix, ty + 86, 30);
        text(`×${n}`, ix + 24, ty + 94, 16, PALETTE.text, 'left');
        ix += 64;
      }
      text(`${current.points} points · ${Math.ceil(current.timeLeft)}s`, tx + tw - 22, ty + 86, 16, PALETTE.muted, 'right');
    } else {
      text('No ticket right now.', tx + 22, ty + th / 2, 18, PALETTE.muted, 'left');
    }

    // the plate
    fill(PLATE_X - 168, PLATE_Y + 8, 336, 44, 22, PALETTE.plate);
    ctx.save();
    ctx.strokeStyle = PALETTE.plateRim;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.ellipse(PLATE_X, PLATE_Y + 30, 150, 30, 0, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();

    // stacked ingredients, bottom first
    for (let i = 0; i < state.plate.stack.length; i++) {
      const id = state.plate.stack[i];
      const ing = INGREDIENT_BY_ID[id];
      const y = PLATE_Y + 8 - (i + 1) * 22;
      ctx.save();
      ctx.globalAlpha = i === state.plate.stack.length - 1 ? 1 : 0.85;
      ctx.fillStyle = ing.colour;
      roundRect(PLATE_X - 84, y - 10, 168, 20, 6);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
    text(`${state.plate.stack.length}/${PLATE_CAPACITY}`, PLATE_X, PLATE_Y - 34, 15, PALETTE.muted, 'center');
  }

  function drawHud(state) {
    text(`Score ${state.score}`, 30, 40, 22, PALETTE.text, 'left');
    const secs = Math.ceil(Math.max(0, state.timeLeft));
    const warn = secs < 40;
    text(`${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`, W / 2, 42, 46, warn ? PALETTE.timerWarn : PALETTE.text, 'center');
    text(`Orders ${state.served}`, W - 30, 40, 22, PALETTE.text, 'right');
    if (state.message && state.messageTimer > 0) {
      text(state.message, W / 2, 102, 17, PALETTE.highlight, 'center');
    }
  }

  function drawHints() {
    text('1-6 pick  ·  click a bin  ·  Enter serve  ·  Backspace clear', W / 2, H - 22, 15, PALETTE.muted, 'center');
  }

  function drawServeButton(state) {
    const x = 430;
    const y = 540;
    const w = 340;
    const h = 50;
    layout.serve = { x, y, w, h };
    const hot = state.plate.stack.length > 0;
    fill(x, y, w, h, 10, hot ? PALETTE.highlight : '#4a505e');
    text(hot ? 'SERVE (Enter)' : 'Plate empty', x + w / 2, y + h / 2, 20, hot ? '#3b2400' : PALETTE.muted, 'center');
  }

  function drawKitchen() {
    // wall
    fill(0, 100, W, H - 100, 0, PALETTE.wall);
    // counter
    fill(0, 460, W, 140, 0, PALETTE.counter);
    ctx.save();
    ctx.strokeStyle = PALETTE.counterEdge;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 460);
    ctx.lineTo(W, 460);
    ctx.stroke();
    ctx.restore();
    // floor
    fill(0, 600, W, 120, 0, '#262b35');
  }

  function drawScreen(screen, state) {
    if (screen === 'title') {
      fill(0, 0, W, H, 0, '#14181f');
      text('RUSH HOUR KITCHEN', W / 2, H / 2 - 60, 56, PALETTE.highlight, 'center');
      text('Tickets are flying. Build the orders, serve the shift.', W / 2, H / 2 - 10, 19, PALETTE.text, 'center');
      text('Space or click to start', W / 2, H / 2 + 34, 20, PALETTE.muted, 'center');
      if (state && state.best) text(`Best score: ${state.best}`, W / 2, H / 2 + 72, 17, PALETTE.muted, 'center');
      text('1-6 pick  ·  Enter serve  ·  Backspace clear', W / 2, H - 40, 15, PALETTE.muted, 'center');
      return;
    }
    if (screen === 'gameover') {
      fill(0, 0, W, H, 0, '#14181f');
      text('SHIFT OVER', W / 2, H / 2 - 60, 56, PALETTE.bad, 'center');
      text(`Final score: ${state.score}`, W / 2, H / 2 - 10, 32, PALETTE.text, 'center');
      text(`Orders served: ${state.served}`, W / 2, H / 2 + 30, 18, PALETTE.muted, 'center');
      if (state.best) text(`Best score: ${state.best}`, W / 2, H / 2 + 60, 17, PALETTE.muted, 'center');
      text('Space or R to play again', W / 2, H / 2 + 106, 20, PALETTE.highlight, 'center');
      return;
    }
    drawKitchen();
    drawHud(state);
    drawCounter(state);
    const current = state.orders[0] || null;
    drawPlate(state, current);
    drawBoard(state.orders);
    drawServeButton(state);
    drawHints();
  }

  function draw(screen, state) {
    layout.bins.length = 0;
    layout.boardTickets = [];
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0b0d12';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    drawScreen(screen, state);
  }

  function hitTest(x, y) {
    for (const bin of layout.bins) {
      if (x >= bin.x && x <= bin.x + bin.w && y >= bin.y && y <= bin.y + bin.h) return { kind: 'ingredient', id: bin.id };
    }
    const s = layout.serve;
    if (s && x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return { kind: 'serve' };
    return null;
  }

  return { setSize, draw, hitTest };
}


