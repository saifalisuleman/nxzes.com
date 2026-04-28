/**
 * NXZES — Tubes cursor effect (native port, no wrapper library)
 * Supports mouse + touch. Works on mobile.
 */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.177.0/build/three.module.js';

// ─── Brand palette ───────────────────────────────────────────────────────────

const BRAND_COLORS   = [0x378ADD, 0x1D9E75, 0x85B7EB];
const BRAND_LIGHTS   = [0x0C447C, 0x1D9E75, 0x378ADD, 0xE6F1FB];
const TUBE_COUNT     = 16;
const TUBE_MATERIAL  = { metalness: 1, roughness: 0.25 };

// ─── Renderer / scene ────────────────────────────────────────────────────────

const canvas   = document.getElementById('tubes-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 1);

const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 5);

// ─── Lights ──────────────────────────────────────────────────────────────────

const lightPositions = [[-5,-5,5],[5,-5,5],[-5,5,5],[5,5,5]];
const lights = BRAND_LIGHTS.concat(BRAND_LIGHTS[3]).slice(0,4).map((color, i) => {
  const l = new THREE.PointLight(color, 200);
  l.position.set(...lightPositions[i]);
  scene.add(l);
  return l;
});

// ─── Simplex-noise helper (3D, inline) ───────────────────────────────────────

function simplex3(x, y, z) {
  const F3 = 1 / 3, G3 = 1 / 6;
  const s = (x + y + z) * F3;
  const i = Math.floor(x + s), j = Math.floor(y + s), k = Math.floor(z + s);
  const t = (i + j + k) * G3;
  const x0 = x - (i - t), y0 = y - (j - t), z0 = z - (k - t);
  let i1, j1, k1, i2, j2, k2;
  if (x0 >= y0) {
    if      (y0 >= z0) { i1=1;j1=0;k1=0;i2=1;j2=1;k2=0; }
    else if (x0 >= z0) { i1=1;j1=0;k1=0;i2=1;j2=0;k2=1; }
    else               { i1=0;j1=0;k1=1;i2=1;j2=0;k2=1; }
  } else {
    if      (y0 < z0)  { i1=0;j1=0;k1=1;i2=0;j2=1;k2=1; }
    else if (x0 < z0)  { i1=0;j1=1;k1=0;i2=0;j2=1;k2=1; }
    else               { i1=0;j1=1;k1=0;i2=1;j2=1;k2=0; }
  }
  const x1=x0-i1+G3, y1=y0-j1+G3, z1=z0-k1+G3;
  const x2=x0-i2+2*G3, y2=y0-j2+2*G3, z2=z0-k2+2*G3;
  const x3=x0-1+3*G3, y3=y0-1+3*G3, z3=z0-1+3*G3;
  const g = [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];
  const hash = v => (v ^ (v >> 4) ^ (v * 1664525 + 1013904223 | 0)) & 0xff;
  const gi = (a,b,c) => { const h=hash(a+hash(b+hash(c))); return g[h%12]; };
  const dot = (g,x,y,z) => g[0]*x+g[1]*y+g[2]*z;
  const n = (t,x,y,z,gi) => {
    const r = 0.6 - x*x - y*y - z*z;
    return r < 0 ? 0 : r*r*r*r*dot(gi,x,y,z);
  };
  return 32*(
    n(0,x0,y0,z0,gi(i&255,j&255,k&255))+
    n(0,x1,y1,z1,gi((i+i1)&255,(j+j1)&255,(k+k1)&255))+
    n(0,x2,y2,z2,gi((i+i2)&255,(j+j2)&255,(k+k2)&255))+
    n(0,x3,y3,z3,gi((i+1)&255,(j+1)&255,(k+1)&255))
  );
}

// ─── Tube class ───────────────────────────────────────────────────────────────

const POINT_COUNT = 10;
const TUBE_SEGS   = 48;
const RADIAL_SEGS = 6;

class Tube {
  constructor(radius, color) {
    this.points = Array.from({ length: POINT_COUNT }, (_, i) => new THREE.Vector3(0, 0, -i * 0.2));
    this.to     = new THREE.Vector3();
    this.offset = Math.random() * 100;
    this.curve  = new THREE.CatmullRomCurve3(this.points);

    this.geometry = new THREE.TubeGeometry(this.curve, TUBE_SEGS, radius, RADIAL_SEGS, false);
    this.material = new THREE.MeshStandardMaterial({
      color,
      metalness: TUBE_MATERIAL.metalness,
      roughness: TUBE_MATERIAL.roughness,
    });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    scene.add(this.mesh);
  }

  lerpTo(target, elapsed, lerpSpeed = 0.5, noiseAmt = 0.05) {
    const t = elapsed;
    const nx = simplex3(0.01 * target.x + 0.04 * t + this.offset,
                         0.01 * target.y + 0.048 * t + this.offset,
                         0.01 * target.z + 0.06 * t + this.offset);
    const ny = simplex3(0.01 * target.x + 0.04 * t + this.offset + 1.5,
                         0.01 * target.y + 0.048 * t + this.offset + 1.5,
                         0.01 * target.z + 0.06 * t + this.offset + 1.5);
    const nz = simplex3(0.01 * target.x + 0.04 * t + this.offset + 3.0,
                         0.01 * target.y + 0.048 * t + this.offset + 3.0,
                         0.01 * target.z + 0.06 * t + this.offset + 3.0);

    this.to.set(
      target.x + nx * noiseAmt,
      target.y + ny * noiseAmt,
      target.z + nz * noiseAmt
    );

    this.points[0].lerp(this.to, lerpSpeed);
    for (let i = 1; i < this.points.length; i++) {
      this.points[i].lerp(this.points[i - 1], lerpSpeed);
    }

    // Rebuild tube geometry in-place
    this.curve.points = this.points;
    this.mesh.geometry.dispose();
    this.mesh.geometry = new THREE.TubeGeometry(this.curve, TUBE_SEGS, this._radius, RADIAL_SEGS, false);
  }
}

// ─── Build color ramp ─────────────────────────────────────────────────────────

function colorAt(colors, t) {
  const c = colors.map(h => new THREE.Color(h));
  const pos = Math.max(0, Math.min(1, t)) * (c.length - 1);
  const lo  = Math.floor(pos);
  if (lo >= c.length - 1) return c[c.length - 1].clone();
  return c[lo].clone().lerp(c[lo + 1], pos - lo);
}

// ─── Instantiate tubes ───────────────────────────────────────────────────────

const tubes = Array.from({ length: TUBE_COUNT }, (_, i) => {
  const radius = THREE.MathUtils.randFloat(0.005, 0.05);
  const color  = colorAt(BRAND_COLORS, i / (TUBE_COUNT - 1));
  const tube   = new Tube(radius, color);
  tube._radius = radius;
  return tube;
});

// ─── Pointer / touch tracking ─────────────────────────────────────────────────

const pointer     = new THREE.Vector2();
const target3D    = new THREE.Vector3();
const plane       = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const raycaster   = new THREE.Raycaster();
let   isHovering  = false;

function updatePointer(clientX, clientY) {
  pointer.x =  (clientX / window.innerWidth)  * 2 - 1;
  pointer.y = -(clientY / window.innerHeight) * 2 + 1;
  isHovering = true;
}

// Mouse
window.addEventListener('mousemove', e => updatePointer(e.clientX, e.clientY));
window.addEventListener('mouseleave', () => { isHovering = false; });

// Touch — use first touch point
window.addEventListener('touchstart', e => {
  e.preventDefault();
  updatePointer(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });

window.addEventListener('touchmove', e => {
  e.preventDefault();
  updatePointer(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });

window.addEventListener('touchend', () => { isHovering = false; });

// ─── Resize ───────────────────────────────────────────────────────────────────

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─── Sleep animation (no pointer) ────────────────────────────────────────────

function sleepTarget(elapsed, wWidth, wHeight) {
  const rx = wWidth  * 0.55;
  const ry = wHeight * 0.35;
  target3D.x = rx * Math.cos(elapsed * 0.6);
  target3D.y = ry * Math.sin(elapsed * 1.2);
  target3D.z = 0;
}

// Approx world size at z=0
function worldSize() {
  const fov = THREE.MathUtils.degToRad(camera.fov);
  const h   = 2 * Math.tan(fov / 2) * camera.position.length();
  return { w: h * camera.aspect, h };
}

// ─── Render loop ──────────────────────────────────────────────────────────────

const clock = new THREE.Clock();
let   elapsed = 0;

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  elapsed += delta;

  if (isHovering) {
    // Project pointer onto the z=0 plane
    camera.getWorldDirection(plane.normal);
    raycaster.setFromCamera(pointer, camera);
    raycaster.ray.intersectPlane(plane, target3D);
  } else {
    const { w, h } = worldSize();
    sleepTarget(elapsed, w, h);
  }

  for (const tube of tubes) {
    tube.lerpTo(target3D, elapsed, isHovering ? 0.5 : 0.06, 0.05);
  }

  renderer.render(scene, camera);
}

animate();
