// A small seeded RNG so screenshots and replays are deterministic.
// xorshift32, returns [0, 1) floats.
export function createRandom(seed) {
  let state = seed >>> 0;
  if (state === 0) state = 0x9e3779b9;
  return {
    next() {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      return (state >>> 0) / 4294967296;
    },
    int(n) {
      return Math.floor(this.next() * n);
    },
    pick(list) {
      return list[this.int(list.length)];
    },
  };
}
