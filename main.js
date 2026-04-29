import TubesCursor from "/tubes.min.js";

const BRAND_COLORS = ["#378ADD", "#1D9E75", "#85B7EB"];
const BRAND_LIGHTS = ["#0C447C", "#1D9E75", "#378ADD", "#E6F1FB"];

const app = TubesCursor(document.getElementById('canvas'), {
  tubes: {
    colors: BRAND_COLORS,
    lights: {
      intensity: 200,
      colors: BRAND_LIGHTS
    }
  }
});

// Click resets to brand colors (no random cycling)
document.body.addEventListener('click', () => {
  app.tubes.setColors(BRAND_COLORS);
  app.tubes.setLightsColors(BRAND_LIGHTS);
});
