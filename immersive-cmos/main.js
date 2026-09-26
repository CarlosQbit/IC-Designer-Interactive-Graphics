import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js';

// ---------------------------------------------------------
// Scene / renderer
// ---------------------------------------------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x071018);
scene.fog = new THREE.Fog(0x071018, 10, 25);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType('local-floor');
document.body.appendChild(renderer.domElement);

// Explicit immersive-VR launcher.
// A user gesture is required by WebXR before an immersive session can begin.
const entry = document.querySelector('#entry');
const enterVR = document.querySelector('#enterVR');
const entryStatus = document.querySelector('#entryStatus');

renderer.xr.addEventListener('sessionstart', () => {
  document.body.classList.add('xr-active');
  document.body.classList.remove('preview');
});

renderer.xr.addEventListener('sessionend', () => {
  document.body.classList.remove('xr-active');
  entry.style.display = 'grid';
  enterVR.textContent = 'ENTER IMMERSIVE VR';
});

async function startImmersiveVR() {
  if (!navigator.xr) return;

  enterVR.disabled = true;
  enterVR.textContent = 'ENTERING VR…';
  entryStatus.textContent = 'Requesting immersive-vr session…';

  try {
    const session = await navigator.xr.requestSession('immersive-vr', {
      requiredFeatures: ['local-floor'],
      optionalFeatures: ['bounded-floor', 'hand-tracking']
    });

    await renderer.xr.setSession(session);
    entryStatus.textContent = 'Immersive session active.';
  } catch (error) {
    console.error(error);
    enterVR.disabled = false;
    enterVR.textContent = 'ENTER IMMERSIVE VR';
    entryStatus.textContent = `Could not enter VR: ${error?.message || error}`;
  }
}

enterVR.addEventListener('click', startImmersiveVR);

// ---------------------------------------------------------
// Lighting / room
// ---------------------------------------------------------
scene.add(new THREE.HemisphereLight(0xcfe5ff, 0x17212b, 2.1));

const key = new THREE.DirectionalLight(0xffffff, 3.1);
key.position.set(4, 7, 5);
scene.add(key);

const fill = new THREE.DirectionalLight(0x83baff, 1.2);
fill.position.set(-5, 3, -5);
scene.add(fill);

const floorMat = new THREE.MeshStandardMaterial({ color: 0x0b151e, roughness: 0.95 });
const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const grid = new THREE.GridHelper(20, 40, 0x34566f, 0x172b3a);
grid.position.y = 0.005;
scene.add(grid);


// ---------------------------------------------------------
// Immersive lab environment
// Surrounding geometry gives the headset strong spatial reference,
// so the experience feels like a place rather than a floating webpage.
// ---------------------------------------------------------
const room = new THREE.Group();
scene.add(room);

const wallMat = new THREE.MeshStandardMaterial({
  color: 0x0c1b26,
  roughness: 0.88,
  metalness: 0.02,
  side: THREE.DoubleSide
});

const accentMat = new THREE.MeshBasicMaterial({
  color: 0x315a73,
  transparent: true,
  opacity: 0.32
});

const backWall = new THREE.Mesh(new THREE.PlaneGeometry(12, 5.5), wallMat);
backWall.position.set(0, 2.75, -7.0);
room.add(backWall);

const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(12, 5.5), wallMat.clone());
leftWall.rotation.y = Math.PI / 2;
leftWall.position.set(-6, 2.75, -1.0);
room.add(leftWall);

const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(12, 5.5), wallMat.clone());
rightWall.rotation.y = -Math.PI / 2;
rightWall.position.set(6, 2.75, -1.0);
room.add(rightWall);

// Large luminous frame behind the device.
const frame = new THREE.Group();
frame.position.set(0, 2.4, -6.88);
room.add(frame);

const framePieces = [
  [7.2, .055, .035, 0, 1.85, 0],
  [7.2, .055, .035, 0, -1.85, 0],
  [.055, 3.75, .035, -3.6, 0, 0],
  [.055, 3.75, .035, 3.6, 0, 0]
];

for (const [w,h,d,x,y,z] of framePieces) {
  const piece = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), accentMat.clone());
  piece.position.set(x,y,z);
  frame.add(piece);
}

// A circular platform under the CMOS model.
const platform = new THREE.Mesh(
  new THREE.CylinderGeometry(1.85, 1.95, 0.12, 64),
  new THREE.MeshStandardMaterial({
    color: 0x122838,
    roughness: 0.55,
    metalness: 0.20,
    emissive: 0x06141e,
    emissiveIntensity: 0.5
  })
);
platform.position.set(0.55, 0.06, -2.6);
scene.add(platform);

// Subtle overhead rings for depth reference.
for (let i = 0; i < 3; i++) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.4 + i * 0.7, 0.012, 8, 96),
    new THREE.MeshBasicMaterial({
      color: 0x284d63,
      transparent: true,
      opacity: 0.22 - i * 0.04
    })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, 3.65 + i * 0.25, -2.8);
  room.add(ring);
}

// ---------------------------------------------------------
// Utilities
// ---------------------------------------------------------
function material(color, {
  opacity = 1,
  roughness = 0.5,
  metalness = 0,
  emissive = 0x000000,
  emissiveIntensity = 0
} = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    transparent: opacity < 1,
    opacity,
    roughness,
    metalness,
    depthWrite: opacity >= 1,
    emissive,
    emissiveIntensity
  });
}

function box(w, h, d, mat) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
}

function makeTextTexture(text, {
  width = 1024,
  height = 256,
  fontSize = 70,
  color = '#ffffff',
  background = null
} = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${fontSize}px system-ui, Segoe UI, Arial`;
  ctx.lineWidth = 12;
  ctx.strokeStyle = 'rgba(0,0,0,.65)';
  ctx.strokeText(text, width / 2, height / 2);
  ctx.fillStyle = color;
  ctx.fillText(text, width / 2, height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return { texture, canvas, ctx };
}

function spriteLabel(text, scale = [1.5, 0.38, 1]) {
  const { texture } = makeTextTexture(text);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false
  }));
  sprite.scale.set(...scale);
  sprite.renderOrder = 20;
  return sprite;
}

function updateDynamicSprite(sprite, text, fontSize = 58) {
  const { canvas, ctx, texture } = sprite.userData;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${fontSize}px system-ui, Segoe UI, Arial`;
  ctx.lineWidth = 12;
  ctx.strokeStyle = 'rgba(0,0,0,.65)';
  ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  texture.needsUpdate = true;
}

function dynamicSprite(text, scale = [1.6, 0.4, 1], fontSize = 58) {
  const data = makeTextTexture(text, { fontSize });
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: data.texture,
    transparent: true,
    depthTest: false
  }));
  sprite.scale.set(...scale);
  sprite.userData = data;
  sprite.renderOrder = 30;
  return sprite;
}

// ---------------------------------------------------------
// CMOS device
// Coordinate system is human scale for VR.
// ---------------------------------------------------------
const device = new THREE.Group();
device.position.set(0.55, 0.92, -2.6);
device.scale.setScalar(0.43);
scene.add(device);

// VDD / GND rails
const railMat = material(0xaeb7c2, { roughness: 0.25, metalness: 0.78 });
let m = box(8.6, 0.20, 0.62, railMat);
m.position.set(0, 4.25, 0);
device.add(m);

m = box(8.6, 0.20, 0.62, railMat.clone());
m.position.set(0, -3.05, 0);
device.add(m);

// pMOS region + well
m = box(6.0, 2.2, 3.45, material(0x6f5bd0, { opacity: 0.20, roughness: 0.35 }));
m.position.set(0, 2.45, 0);
device.add(m);

m = box(5.0, 1.35, 2.8, material(0xb95f8e, { roughness: 0.52 }));
m.position.set(0, 2.48, 0);
device.add(m);

// nMOS region
m = box(5.0, 1.35, 2.8, material(0x477cb8, { roughness: 0.52 }));
m.position.set(0, -1.12, 0);
device.add(m);

// source/drain regions
const pPlus = material(0xf490b9, { roughness: 0.33 });
const nPlus = material(0x55aaff, { roughness: 0.33 });

for (const x of [-1.65, 1.65]) {
  m = box(1.05, 0.74, 2.18, pPlus.clone());
  m.position.set(x, 2.52, 0);
  device.add(m);
}

for (const x of [-1.65, 1.65]) {
  m = box(1.05, 0.74, 2.18, nPlus.clone());
  m.position.set(x, -1.08, 0);
  device.add(m);
}

// oxide + gates
const oxide = material(0xbdecff, { opacity: 0.56, roughness: 0.2 });
const gate = material(0xcdd2d9, { roughness: 0.22, metalness: 0.72 });

m = box(1.46, 0.13, 2.28, oxide);
m.position.set(0, 3.19, 0);
device.add(m);

m = box(1.16, 0.38, 2.16, gate);
m.position.set(0, 3.45, 0);
device.add(m);

m = box(1.46, 0.13, 2.28, oxide.clone());
m.position.set(0, -0.37, 0);
device.add(m);

m = box(1.16, 0.38, 2.16, gate.clone());
m.position.set(0, -0.11, 0);
device.add(m);

// interconnect
const wire = material(0xdbe3eb, { roughness: 0.20, metalness: 0.76 });
const wires = [
  [0.20, 3.80, 0.30, -3.05, 1.72, 1.32],
  [2.78, 0.20, 0.30, -1.40, 3.45, 1.32],
  [2.78, 0.20, 0.30, -1.40, -0.11, 1.32],
  [0.25, 0.95, 0.38, -1.65, 3.77, 1.25],
  [0.25, 1.00, 0.38, 1.65, -2.34, 1.25],
  [0.28, 2.92, 0.40, 1.65, 0.63, 1.30],
  [2.40, 0.28, 0.40, 2.74, 0.63, 1.30]
];
for (const [w,h,d,x,y,z] of wires) {
  m = box(w,h,d,wire.clone());
  m.position.set(x,y,z);
  device.add(m);
}

// channels
const pChannel = box(
  2.38, 0.11, 2.16,
  material(0xff77ac, { opacity: 0.90, roughness: 0.2, emissive: 0x7a1642, emissiveIntensity: 1.2 })
);
pChannel.position.set(0, 3.14, 0);
device.add(pChannel);

const nChannel = box(
  2.38, 0.11, 2.16,
  material(0x44e2ff, { opacity: 0.10, roughness: 0.2, emissive: 0x0b6678, emissiveIntensity: 0.25 })
);
nChannel.position.set(0, -0.42, 0);
device.add(nChannel);

// world labels
const labelGroup = new THREE.Group();
device.add(labelGroup);

const labels = [
  ['VDD', 0, 4.90, 0],
  ['PMOS', 3.40, 2.60, 0],
  ['VIN', -3.80, 1.72, 1.25],
  ['VOUT', 4.48, 0.63, 1.25],
  ['NMOS', 3.40, -1.05, 0],
  ['GND', 0, -3.70, 0]
];

for (const [text,x,y,z] of labels) {
  const s = spriteLabel(text, [2.4, 0.58, 1]);
  s.position.set(x,y,z);
  labelGroup.add(s);
}

// ---------------------------------------------------------
// Current-flow particles
// ---------------------------------------------------------
const particleGroup = new THREE.Group();
device.add(particleGroup);

const currentParticles = [];
const currentMat = material(0xffd276, {
  roughness: 0.15,
  emissive: 0xff8a00,
  emissiveIntensity: 1.6
});

for (let i = 0; i < 18; i++) {
  const p = new THREE.Mesh(new THREE.SphereGeometry(0.095, 14, 14), currentMat.clone());
  particleGroup.add(p);
  currentParticles.push(p);
}

function placeParticle(p, t, mode) {
  if (mode === 'p') {
    if (t < 0.34) {
      const u = t / 0.34;
      p.position.set(-1.65, 4.15 - 1.05*u, 1.25);
    } else {
      const u = (t - 0.34) / 0.66;
      p.position.set(-1.65 + 3.30*u, 3.10 - 2.45*u, 1.30);
    }
  } else if (mode === 'n') {
    if (t < 0.55) {
      const u = t / 0.55;
      p.position.set(3.90 - 2.25*u, 0.63 - 1.75*u, 1.30);
    } else {
      const u = (t - 0.55) / 0.45;
      p.position.set(1.65, -1.12 - 1.85*u, 1.25);
    }
  } else {
    // transition: illustrative VDD-to-GND path
    if (t < 0.25) {
      const u = t / 0.25;
      p.position.set(-1.65, 4.15 - 1.05*u, 1.25);
    } else if (t < 0.56) {
      const u = (t - 0.25) / 0.31;
      p.position.set(-1.65 + 3.30*u, 3.10 - 2.47*u, 1.30);
    } else {
      const u = (t - 0.56) / 0.44;
      p.position.set(1.65, 0.63 - 3.63*u, 1.25);
    }
  }
}

// ---------------------------------------------------------
// In-world XR control panel
// ---------------------------------------------------------
const xrPanel = new THREE.Group();
xrPanel.position.set(-1.35, 1.40, -2.25);
xrPanel.rotation.y = THREE.MathUtils.degToRad(12);
scene.add(xrPanel);

const back = box(1.40, 1.72, 0.045, material(0x0d2030, {
  opacity: 0.95,
  roughness: 0.50,
  emissive: 0x04131e,
  emissiveIntensity: 0.35
}));
xrPanel.add(back);

const title = dynamicSprite('CMOS INVERTER', [1.10, 0.25, 1], 58);
title.position.set(0, 0.69, 0.035);
xrPanel.add(title);

const xrVin = dynamicSprite('VIN = 0.00 VDD', [1.12, 0.24, 1], 54);
xrVin.position.set(0, 0.46, 0.035);
xrPanel.add(xrVin);

const xrVout = dynamicSprite('VOUT ≈ 1.00 VDD', [1.12, 0.24, 1], 50);
xrVout.position.set(0, 0.25, 0.035);
xrPanel.add(xrVout);

const xrState = dynamicSprite('PMOS ON • NMOS OFF', [1.16, 0.23, 1], 44);
xrState.position.set(0, 0.05, 0.035);
xrPanel.add(xrState);

const interactables = [];
function worldButton(text, x, y, w, action) {
  const mesh = box(w, 0.20, 0.065, material(0x31536d, {
    roughness: 0.38,
    emissive: 0x000000,
    emissiveIntensity: 0
  }));
  mesh.position.set(x, y, 0.065);
  mesh.userData.action = action;
  mesh.userData.normalColor = 0x31536d;
  xrPanel.add(mesh);

  const label = dynamicSprite(text, [w * 0.93, 0.17, 1], 46);
  label.position.set(x, y, 0.105);
  xrPanel.add(label);

  mesh.userData.label = label;
  interactables.push(mesh);
  return mesh;
}

worldButton('VIN LOW', -0.43, -0.24, 0.42, 'low');
worldButton('MID', 0, -0.24, 0.31, 'mid');
worldButton('VIN HIGH', 0.43, -0.24, 0.42, 'high');
worldButton('− 0.10', -0.31, -0.50, 0.50, 'minus');
worldButton('+ 0.10', 0.31, -0.50, 0.50, 'plus');
const currentButton = worldButton('CURRENT: ON', 0, -0.77, 0.94, 'current');
const labelsButton = worldButton('LABELS: ON', 0, -1.03, 0.94, 'labels');

const footer = dynamicSprite('Point + trigger / pinch', [1.06, 0.19, 1], 40);
footer.position.set(0, -1.31, 0.04);
xrPanel.add(footer);

// ---------------------------------------------------------
// State
// ---------------------------------------------------------
let vin = 0;
let showCurrent = true;
let showLabels = true;

const vinInput = document.querySelector('#vin');
const vinValue = document.querySelector('#vinValue');
const stateEl = document.querySelector('#state');

function smoothstep(a, b, x) {
  x = THREE.MathUtils.clamp((x-a)/(b-a), 0, 1);
  return x*x*(3-2*x);
}

function syncToggleLabels() {
  updateDynamicSprite(currentButton.userData.label, `CURRENT: ${showCurrent ? 'ON' : 'OFF'}`, 43);
  updateDynamicSprite(labelsButton.userData.label, `LABELS: ${showLabels ? 'ON' : 'OFF'}`, 43);
}

function updateState() {
  vin = Number(vinInput.value);

  const nDrive = smoothstep(0.35, 0.72, vin);
  const pDrive = 1 - smoothstep(0.28, 0.65, vin);
  const vout = pDrive / (pDrive + nDrive + 1e-6);

  vinValue.textContent = `${vin.toFixed(2)} VDD`;

  pChannel.material.opacity = 0.08 + 0.84*pDrive;
  pChannel.material.emissiveIntensity = 0.18 + 1.65*pDrive;

  nChannel.material.opacity = 0.08 + 0.84*nDrive;
  nChannel.material.emissiveIntensity = 0.18 + 1.65*nDrive;

  updateDynamicSprite(xrVin, `VIN = ${vin.toFixed(2)} VDD`, 52);
  updateDynamicSprite(xrVout, `VOUT ≈ ${vout.toFixed(2)} VDD`, 48);

  if (vin < 0.32) {
    stateEl.textContent = 'PMOS ON · NMOS OFF · VOUT ≈ VDD';
    updateDynamicSprite(xrState, 'PMOS ON • NMOS OFF', 44);
  } else if (vin > 0.68) {
    stateEl.textContent = 'PMOS OFF · NMOS ON · VOUT ≈ 0';
    updateDynamicSprite(xrState, 'PMOS OFF • NMOS ON', 44);
  } else {
    stateEl.textContent = 'Transition region · both devices may conduct';
    updateDynamicSprite(xrState, 'TRANSITION • BOTH CONDUCT', 38);
  }
}

function activate(action) {
  if (action === 'low') vinInput.value = 0;
  if (action === 'mid') vinInput.value = 0.5;
  if (action === 'high') vinInput.value = 1;
  if (action === 'minus') vinInput.value = Math.max(0, Number(vinInput.value) - 0.10).toFixed(2);
  if (action === 'plus') vinInput.value = Math.min(1, Number(vinInput.value) + 0.10).toFixed(2);

  if (['low','mid','high','minus','plus'].includes(action)) {
    updateState();
  }

  if (action === 'current') {
    showCurrent = !showCurrent;
    document.querySelector('#toggleCurrent').textContent = `Current Path: ${showCurrent ? 'ON' : 'OFF'}`;
    syncToggleLabels();
  }

  if (action === 'labels') {
    showLabels = !showLabels;
    labelGroup.visible = showLabels;
    document.querySelector('#toggleLabels').textContent = `Labels: ${showLabels ? 'ON' : 'OFF'}`;
    syncToggleLabels();
  }
}

// desktop controls
vinInput.addEventListener('input', updateState);
document.querySelector('#low').onclick = () => { vinInput.value = 0; updateState(); };
document.querySelector('#mid').onclick = () => { vinInput.value = 0.5; updateState(); };
document.querySelector('#high').onclick = () => { vinInput.value = 1; updateState(); };
document.querySelector('#toggleCurrent').onclick = () => activate('current');
document.querySelector('#toggleLabels').onclick = () => activate('labels');

// ---------------------------------------------------------
// XR controller + hand input
// ---------------------------------------------------------
const controllerModelFactory = new XRControllerModelFactory();
const handModelFactory = new XRHandModelFactory();

const tempMatrix = new THREE.Matrix4();
const raycaster = new THREE.Raycaster();
const rayOrigin = new THREE.Vector3();
const rayDirection = new THREE.Vector3();

function createRayLine() {
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0,0,0),
    new THREE.Vector3(0,0,-1)
  ]);
  const line = new THREE.Line(
    geometry,
    new THREE.LineBasicMaterial({ color: 0x9fe7ff, transparent: true, opacity: 0.85 })
  );
  line.name = 'ray';
  line.scale.z = 5;
  return line;
}

function intersectFromController(controller) {
  tempMatrix.identity().extractRotation(controller.matrixWorld);
  rayOrigin.setFromMatrixPosition(controller.matrixWorld);
  rayDirection.set(0,0,-1).applyMatrix4(tempMatrix).normalize();
  raycaster.set(rayOrigin, rayDirection);
  return raycaster.intersectObjects(interactables, false)[0] || null;
}

function onSelectStart(event) {
  const controller = event.target;
  const hit = intersectFromController(controller);
  if (hit?.object?.userData?.action) {
    activate(hit.object.userData.action);
    controller.userData.selected = hit.object;
  }
}

function onSelectEnd(event) {
  event.target.userData.selected = null;
}

for (let i = 0; i < 2; i++) {
  const controller = renderer.xr.getController(i);
  controller.add(createRayLine());
  controller.addEventListener('selectstart', onSelectStart);
  controller.addEventListener('selectend', onSelectEnd);
  scene.add(controller);

  const grip = renderer.xr.getControllerGrip(i);
  grip.add(controllerModelFactory.createControllerModel(grip));
  scene.add(grip);

  // If the input source is a tracked hand, Three.js will populate this group.
  const hand = renderer.xr.getHand(i);
  const handModel = handModelFactory.createHandModel(hand, 'mesh');
  hand.add(handModel);
  scene.add(hand);
}

// Hover highlighting for either controller/hand target rays.
// renderer.xr.getController() represents target-ray spaces; Meta's WebXR hands
// expose an emulated pointing target ray, so the same interaction model can work.
function updateXRHover() {
  for (const obj of interactables) {
    obj.userData.hovered = false;
  }

  for (let i = 0; i < 2; i++) {
    const controller = renderer.xr.getController(i);
    if (!controller.visible) continue;
    const hit = intersectFromController(controller);
    if (hit) hit.object.userData.hovered = true;
  }

  for (const obj of interactables) {
    const selected = obj.parent?.userData?.selected === obj || false;
    obj.material.color.setHex(obj.userData.hovered ? 0x5b97bd : obj.userData.normalColor);
    obj.material.emissive.setHex(obj.userData.hovered ? 0x123f58 : 0x000000);
    obj.material.emissiveIntensity = obj.userData.hovered ? 0.9 : 0;
    obj.scale.setScalar(obj.userData.hovered ? 1.035 : 1);
  }
}

// ---------------------------------------------------------
// Desktop orbit camera
// ---------------------------------------------------------
const camera = new THREE.PerspectiveCamera(55, innerWidth/innerHeight, 0.03, 100);
const orbitTarget = new THREE.Vector3(0, 1.25, -2.5);
let yaw = 0.42;
let pitch = 0.14;
let distance = 5.1;
let dragging = false;
let lastX = 0, lastY = 0;

function updateDesktopCamera() {
  camera.position.set(
    orbitTarget.x + distance*Math.sin(yaw)*Math.cos(pitch),
    orbitTarget.y + distance*Math.sin(pitch),
    orbitTarget.z + distance*Math.cos(yaw)*Math.cos(pitch)
  );
  camera.lookAt(orbitTarget);
}
updateDesktopCamera();

renderer.domElement.addEventListener('pointerdown', e => {
  if (renderer.xr.isPresenting) return;
  dragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
});

addEventListener('pointerup', () => dragging = false);

addEventListener('pointermove', e => {
  if (!dragging || renderer.xr.isPresenting) return;
  yaw -= (e.clientX-lastX)*0.006;
  pitch += (e.clientY-lastY)*0.005;
  pitch = THREE.MathUtils.clamp(pitch, -1.05, 1.05);
  lastX = e.clientX;
  lastY = e.clientY;
  updateDesktopCamera();
});

renderer.domElement.addEventListener('wheel', e => {
  if (renderer.xr.isPresenting) return;
  distance *= Math.exp(e.deltaY*0.001);
  distance = THREE.MathUtils.clamp(distance, 2.8, 9);
  updateDesktopCamera();
}, { passive:true });

// ---------------------------------------------------------
// WebXR support detection / launcher state
// ---------------------------------------------------------
async function detectXR() {
  if (!navigator.xr) {
    enterVR.disabled = true;
    enterVR.textContent = 'WEBXR NOT AVAILABLE';
    entryStatus.textContent = 'This browser does not expose the WebXR Device API.';
    return;
  }

  try {
    const supported = await navigator.xr.isSessionSupported('immersive-vr');

    if (supported) {
      enterVR.disabled = false;
      enterVR.textContent = 'ENTER IMMERSIVE VR';
      entryStatus.textContent = 'Immersive VR detected. Ready to enter.';
    } else {
      enterVR.disabled = true;
      enterVR.textContent = 'IMMERSIVE VR NOT DETECTED';
      entryStatus.textContent = 'Open this HTTPS URL in Meta Quest Browser.';
    }
  } catch (error) {
    enterVR.disabled = true;
    enterVR.textContent = 'VR CHECK FAILED';
    entryStatus.textContent = `WebXR detection failed: ${error?.message || error}`;
  }
}
detectXR();

// Desktop users can dismiss the launcher and inspect the preview.
if (!navigator.xr) {
  entry.addEventListener('dblclick', () => {
    document.body.classList.add('preview');
  });
}

// ---------------------------------------------------------
// Animation
// ---------------------------------------------------------
function animate(time) {
  const mode = vin < 0.32 ? 'p' : vin > 0.68 ? 'n' : 'both';
  particleGroup.visible = showCurrent;

  currentParticles.forEach((p,i) => {
    const speed = mode === 'both' ? 0.00011 : 0.00015;
    const t = (time*speed + i/currentParticles.length) % 1;
    placeParticle(p, t, mode);
  });

  if (renderer.xr.isPresenting) updateXRHover();

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

syncToggleLabels();
updateState();
