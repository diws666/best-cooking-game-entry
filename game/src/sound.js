// Own sounds: synthesized with the Web Audio API, no audio files, no network.
// Lazily initialises the audio context on the first player interaction.

let ctx;
let started = false;

function ensure() {
  if (started) return ctx;
  started = true;
  try {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (Ctor) ctx = new Ctor();
  } catch {
    ctx = null;
  }
  return ctx;
}

function tone(freq, duration, type = 'square', volume = 0.06, when = 0) {
  const c = ensure();
  if (!c) return;
  const t = c.currentTime + when;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(t);
  osc.stop(t + duration);
}

export const sound = {
  pick() { tone(700, 0.04, 'square', 0.05); },
  spawn() { tone(400, 0.06, 'triangle', 0.05); },
  serve() { tone(520, 0.08, 'square', 0.07); tone(660, 0.08, 'square', 0.07, 0.08); },
  wrong() { tone(150, 0.25, 'sawtooth', 0.08); },
  tick() { tone(900, 0.03, 'sine', 0.03); },
  gameOver() {
    tone(220, 0.3, 'sawtooth', 0.09);
    tone(160, 0.5, 'sawtooth', 0.09, 0.2);
  },
};
