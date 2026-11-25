// Keyboard and mouse input, one job: report what happened this frame and where
// the last click landed, in logical canvas coordinates.

export const ACTION_CONFIRM = 1;
export const ACTION_CLEAR = 2;
export const ACTION_RESTART = 4;

export function createInput(canvas) {
  const keysDown = new Set();
  const justPressed = new Set();
  const ingredientKey = new Set();
  let clickX = null;
  let clickY = null;
  let rect = null;

  function bounding() {
    rect = canvas.getBoundingClientRect();
  }

  function onKey(type, event) {
    const code = event.code;
    const key = event.key;
    if (type === 'keydown') {
      if (keysDown.has(code)) return;
      keysDown.add(code);
      justPressed.add(code);
      justPressed.add(key);
      if (key >= '1' && key <= '6') ingredientKey.add(code);
    } else {
      keysDown.delete(code);
    }
  }

  function onClick(event) {
    if (!rect) bounding();
    clickX = (event.clientX - rect.left) * (canvas.width / rect.width);
    clickY = (event.clientY - rect.top) * (canvas.height / rect.height);
  }

  window.addEventListener('keydown', (e) => onKey('keydown', e), { passive: false });
  window.addEventListener('keyup', (e) => onKey('keyup', e), { passive: false });
  canvas.addEventListener('mousedown', onClick, { passive: false });
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const t = e.changedTouches[0];
    onClick({ clientX: t.clientX, clientY: t.clientY });
  }, { passive: false });

  return {
    // Resize-aware: call before reading click coordinates.
    bounding,
    takeActions() {
      const actions =
        (justPressed.has('Enter') || justPressed.has(' ') ? ACTION_CONFIRM : 0) |
        (justPressed.has('Backspace') ? ACTION_CLEAR : 0) |
        (justPressed.has('KeyR') ? ACTION_RESTART : 0);
      const ingredient = ingredientKey.size > 0 ? [...ingredientKey][0] : null;
      const click = clickX === null ? null : { x: clickX, y: clickY };
      justPressed.clear();
      ingredientKey.clear();
      clickX = null;
      clickY = null;
      return { actions, ingredient, click };
    },
  };
}
