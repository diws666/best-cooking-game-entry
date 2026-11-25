// The order board: orders spawn, count down, expire and get served.

import { RECIPE_BY_ID, RECIPES, SPAWN } from './config.js';
import { createRandom } from './random.js';

export function createOrder() {
  return {
    id: 0,
    recipeId: '',
    name: '',
    needs: {},
    points: 0,
    time: 0,
    timeLeft: 0,
    expired: false,
    served: false,
  };
}

export function createOrderBoard({ rng, now }) {
  const orders = [];
  let nextId = 1;
  let spawnAccum = 0;
  let spawnInterval = SPAWN.start;

  function spawn(level) {
    if (orders.length >= SPAWN.maxActive) return null;
    const recipe = RECIPES[rng.int(RECIPES.length)];
    const order = createOrder();
    order.id = nextId++;
    order.recipeId = recipe.id;
    order.name = recipe.name;
    order.needs = recipe.needs;
    order.points = recipe.points;
    order.time = recipe.time;
    order.timeLeft = recipe.time;
    order.expired = false;
    order.served = false;
    orders.push(order);
    return order;
  }

  return {
    orders,
    spawn(level) {
      return spawn(level);
    },
    update(dt, level) {
      spawnAccum += dt;
      spawnInterval = Math.max(SPAWN.min, SPAWN.start - level * SPAWN.perLevel);
      let spawned = null;
      while (spawnAccum >= spawnInterval && orders.length < SPAWN.maxActive) {
        spawnAccum -= spawnInterval;
        spawned = spawn(level);
      }
      for (const order of orders) {
        order.timeLeft -= dt;
        if (order.timeLeft <= 0 && !order.expired && !order.served) {
          order.expired = true;
          order.timeLeft = 0;
        }
      }
      return spawned;
    },
    serve(plateCounts) {
      for (const order of orders) {
        if (order.served || order.expired) continue;
        let match = true;
        const ids = new Set([...Object.keys(plateCounts), ...Object.keys(order.needs)]);
        for (const id of ids) {
          if ((plateCounts[id] || 0) !== (order.needs[id] || 0)) { match = false; break; }
        }
        if (match) {
          order.served = true;
          return order;
        }
      }
      return null;
    },
    expireAll() {
      for (const order of orders) {
        if (!order.served) order.expired = true;
      }
    },
    active() {
      return orders.filter((o) => !o.served && !o.expired);
    },
  };
}
