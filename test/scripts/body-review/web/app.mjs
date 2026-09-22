/**
 * Draw one built body state from `build-body.ts` for the capture harness.
 *
 * The page is deliberately dumb: it reads a JSON of positions, normals,
 * indices, posed joints and landmarks, puts it under a form-revealing key
 * light with a soft fill, and exposes `window.__bodyReview` so
 * `render-body.mjs` can pick a view, a shading mode and read the renderer
 * string. Nothing here transforms the body except the ground translation
 * that puts the feet on Y = 0 for framing; the calibration bar beside the
 * subject is typed here by hand (one metre tall, 0.1 m wide, at X = +0.75 m)
 * so a frame carries its own scale and handedness check independent of the
 * code under test.
 */
import * as THREE from "/three.module.js";

const label = document.getElementById("label");
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  preserveDrawingBuffer: true,
});
renderer.setPixelRatio(1);
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.append(renderer.domElement);
const gl = renderer.getContext();
const debug = gl.getExtension("WEBGL_debug_renderer_info");
const device = debug
  ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
  : "unknown";
console.log("RENDERER", device);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x06080c);
const camera = new THREE.PerspectiveCamera(
  28,
  innerWidth / innerHeight,
  0.01,
  50,
);
const key = new THREE.DirectionalLight(0xfff1e0, 2.6);
key.position.set(2.5, 4, 3);
const fill = new THREE.DirectionalLight(0xbfd4ff, 0.7);
fill.position.set(-3, 1.5, -2);
// The back view had only the fill: a second key behind the subject keeps the
// form readable from behind without flattening the front.
const rear = new THREE.DirectionalLight(0xfff1e0, 1.6);
rear.position.set(-2, 3.5, -3.5);
scene.add(key, fill, rear, new THREE.AmbientLight(0xffffff, 0.35));
scene.add(new THREE.GridHelper(4, 16, 0x334155, 0x1e293b));

const skin = new THREE.MeshStandardMaterial({
  color: new THREE.Color(0.58, 0.34, 0.3),
  roughness: 0.55,
  side: THREE.DoubleSide,
});
const clay = new THREE.MeshStandardMaterial({
  color: 0x9a9a9a,
  roughness: 0.85,
  side: THREE.DoubleSide,
});
const group = new THREE.Group();
scene.add(group);
// Calibration: a one metre bar, hand typed, so scale and the +X side read
// from the frame itself. It stands at the subject's left hand (+X).
const bar = new THREE.Mesh(
  new THREE.BoxGeometry(0.1, 1, 0.1),
  new THREE.MeshStandardMaterial({ color: 0x38bdf8 }),
);
bar.position.set(0.75, 0.5, -0.3);
scene.add(bar);

let mesh = null;
let joints = null;
let state = "none";
let bones = new Map();
let groundY = 0;

async function load(name) {
  const record = await (await fetch(`/data/${name}.json`)).json();
  if (mesh !== null) {
    group.remove(mesh, joints);
    mesh.geometry.dispose();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(record.positions, 3),
  );
  geometry.setAttribute(
    "normal",
    new THREE.Float32BufferAttribute(record.normals, 3),
  );
  geometry.setIndex(record.indices);
  mesh = new THREE.Mesh(geometry, skin);
  joints = new THREE.Group();
  const marker = new THREE.SphereGeometry(0.012, 12, 8);
  const material = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  for (const bone of record.bones) {
    const sphere = new THREE.Mesh(marker, material);
    sphere.position.set(bone.posed.x, bone.posed.y, bone.posed.z);
    joints.add(sphere);
  }
  joints.visible = false;
  group.add(mesh, joints);
  group.position.set(0, -record.groundY, 0);
  bones = new Map(record.bones.map((bone) => [bone.bone, bone.posed]));
  groundY = record.groundY;
  state = name;
  label.textContent = `${record.basis}\n${name}\n${device}`;
  render();
}

/**
 * Frame the whole body from a canonical view, or, with `focus`, a posed joint
 * seen from `distance` metres so a fold at that joint fills the frame.
 */
function view(name, mode, showJoints, focus = null, distance = 4.6) {
  const angles = {
    front: 0,
    "left-three-quarter": 45,
    left: 90,
    back: 180,
    right: -90,
    "right-three-quarter": -45,
    top: 0,
  };
  const yaw = ((angles[name] ?? 0) * Math.PI) / 180;
  const at = focus === null ? { x: 0, y: 0.9, z: 0 } : bones.get(focus);
  if (at === undefined) throw new Error("no posed bone named " + focus);
  const target = focus === null ? at : { x: at.x, y: at.y - groundY, z: at.z };
  const pitch = name === "top" ? Math.PI / 2 - 0.05 : 0;
  camera.position.set(
    target.x + Math.sin(yaw) * Math.cos(pitch) * distance,
    target.y + (focus === null ? 0.1 : Math.sin(pitch) * distance),
    target.z + Math.cos(yaw) * Math.cos(pitch) * distance,
  );
  camera.lookAt(target.x, target.y, target.z);
  mesh.material = mode === "clay" ? clay : skin;
  joints.visible = Boolean(showJoints);
  render();
}

function render() {
  renderer.render(scene, camera);
  gl.finish();
}

addEventListener("resize", () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  render();
});

window.__bodyReview = { load, view, device: () => device, state: () => state };
