// The plate: the stack of ingredients the player is assembling, one job only.

import { PLATE_CAPACITY } from './config.js';

export function createPlate() {
  return {
    stack: [], // ingredient ids, bottom to top
  };
}

export function plateCounts(stack) {
  const counts = {};
  for (const id of stack) counts[id] = (counts[id] || 0) + 1;
  return counts;
}

export function canAdd(plate) {
  return plate.stack.length < 6; // PLATE_CAPACITY imported where needed
}

export function add(plate, id) {
  if (plate.stack.length >= PLATE_CAPACITY) return false;
  plate.stack.push(id);
  return true;
}

export function clear(plate) {
  plate.stack.length = 0;
}

export function matches(plate, needs) {
  const counts = plateCounts(plate.stack);
  const ids = new Set([...Object.keys(counts), ...Object.keys(needs)]);
  for (const id of ids) {
    if ((counts[id] || 0) !== (needs[id] || 0)) return false;
  }
  return true;
}
