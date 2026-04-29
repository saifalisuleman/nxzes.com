import TubesCursor from "/tubes.min.js";

const BRAND_COLORS = ["#378ADD", "#1D9E75", "#85B7EB"];
const BRAND_LIGHTS = ["#0C447C", "#1D9E75", "#378ADD", "#E6F1FB"];

const canvas = document.getElementById('canvas');

const app = TubesCursor(canvas, {
  rendererOptions: {
    forceWebGL: true,
  },
  tubes: {
    colors: BRAND_COLORS,
    lights: {
      intensity: 200,
      colors: BRAND_LIGHTS
    }
  }
});

// Shared reset handler used by both click and tap
function resetColors() {
  app.tubes.setColors(BRAND_COLORS);
  app.tubes.setLightsColors(BRAND_LIGHTS);
}

// Mouse click — resets to brand colors
document.body.addEventListener('click', resetColors);

// Touch support — synthesize pointer movement from touch events
// so the tubes follow the finger on mobile
document.body.addEventListener('touchmove', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  // Dispatch a synthetic pointermove so the underlying cursor tracker picks it up
  const pointerEvent = new PointerEvent('pointermove', {
    clientX: touch.clientX,
    clientY: touch.clientY,
    bubbles: true,
    cancelable: true,
    pointerType: 'touch',
  });
  document.body.dispatchEvent(pointerEvent);
}, { passive: false });

// Touch end — reset colors (mirrors the click behaviour)
document.body.addEventListener('touchend', (e) => {
  e.preventDefault();
  resetColors();

  // Fire a pointerleave so the idle animation resumes if the finger lifts
  const touch = e.changedTouches[0];
  const leaveEvent = new PointerEvent('pointerleave', {
    clientX: touch.clientX,
    clientY: touch.clientY,
    bubbles: true,
    cancelable: true,
    pointerType: 'touch',
  });
  document.body.dispatchEvent(leaveEvent);
}, { passive: false });

// Touch start — route to pointermove immediately so there's no initial lag
document.body.addEventListener('touchstart', (e) => {
  const touch = e.touches[0];
  const pointerEvent = new PointerEvent('pointermove', {
    clientX: touch.clientX,
    clientY: touch.clientY,
    bubbles: true,
    cancelable: true,
    pointerType: 'touch',
  });
  document.body.dispatchEvent(pointerEvent);
}, { passive: true });
