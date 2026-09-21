// @ts-check
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { uploadHouse, disposeHouse } from "./scene.mjs";
/** @typedef {ReturnType<typeof import('./payload.js').createViewerPayload> & {basis: string}} Payload */

async function start() {
if (new URL(location.href).searchParams.get("capture") === "1") document.body.classList.add("capture");
/** @template {Element} T @param {string} selector @param {new () => T} kind */
function required(selector, kind) {
  const value = document.querySelector(selector);
  if (!(value instanceof kind)) throw new Error("Viewer control missing: " + selector);
  return value;
}
const canvas = required("canvas", HTMLCanvasElement);
const status = required("#status", HTMLElement);
const spaceSelect = required("#space", HTMLSelectElement);
const stationSelect = required("#station", HTMLSelectElement);
const inspection = required("#inspection", HTMLInputElement);
const details = required("#details", HTMLElement);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const gl = renderer.getContext();
const debug = gl.getExtension("WEBGL_debug_renderer_info");
const hardware = debug ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)) : null;
console.info("RENDERER", hardware ?? "unverified: debug renderer information unavailable");
const scene = new THREE.Scene();
scene.background = new THREE.Color("#dce3e5");
const camera = new THREE.PerspectiveCamera(50, 1, 0.02, 300);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = false;
controls.minDistance = 0.1;
controls.maxDistance = 150;
const sky = new THREE.HemisphereLight(0xe8f1ff, 0x887b65, 1.25);
const sun = new THREE.DirectionalLight(0xffefdb, 3);
sun.position.set(-12, 18, -8);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -18;
sun.shadow.camera.right = 18;
sun.shadow.camera.top = 18;
sun.shadow.camera.bottom = -18;
sun.shadow.camera.far = 70;
sun.shadow.normalBias = 0.015;
scene.add(sky, sun, sun.target);
/** @type {Payload | null} */
let payload = null;
/** @type {THREE.Group | null} */
let house = null;
/** @type {THREE.Box3Helper | null} */
let outline = null;
let running = true;
let observation = "free";
/** @type {string | null} */
let observationSpace = null;
let poll = 0;

function reset() {
  if (!house || !running) return;
  const bounds = new THREE.Box3().setFromObject(house);
  const centre = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const distance = size.length() / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
  controls.target.copy(centre);
  camera.position.copy(centre).add(new THREE.Vector3(-0.85, 0.45, -1).normalize().multiplyScalar(distance));
  controls.update();
  observation = "free";
  observationSpace = null;
  report();
}
function report() {
  if (!payload) return;
  details.textContent = JSON.stringify({ source: payload.basis, selectedSpace: spaceSelect.value, cameraSpace: observationSpace, observation, inspection: inspection.checked, renderer: hardware, eye: camera.position.toArray(), target: controls.target.toArray(), census: payload.census, observationBasis: payload.observationBasis }, null, 2);
}
function selectSpace() {
  if (!payload || !running) return;
  observation = "free"; observationSpace = null;
  status.textContent = "공간 선택됨 · 카메라 관찰은 아직 선택하지 않았습니다.";
  stationSelect.replaceChildren(new Option("관찰 id 선택", ""));
  for (const station of payload.stations.filter((entry) => entry.space === spaceSelect.value)) {
    const option = new Option(station.id + (station.pose ? "" : " · 위치 없음"), station.id);
    stationSelect.add(option);
  }
  report();
}
function selectStation() {
  if (!payload || !inspection.checked || !running) return;
  const station = payload.stations.find((entry) => entry.space === spaceSelect.value && entry.id === stationSelect.value);
  if (!station) return;
  observation = station.space + "/" + station.id;
  observationSpace = station.pose ? station.space : null;
  if (!station.pose) { status.textContent = observation + ": 카메라 위치 unverified"; report(); return; }
  camera.position.copy(station.pose.position);
  controls.target.copy(station.pose.target);
  controls.update();
  status.textContent = "엔진 진단 위치 — 저작된 관찰 조건과의 대조는 미완료";
  report();
}
/** @param {unknown} error */
function fail(error) {
  running = false;
  observation = "invalid"; observationSpace = null;
  controls.enabled = false;
  spaceSelect.disabled = true; stationSelect.disabled = true; inspection.disabled = true;
  canvas.hidden = true;
  status.setAttribute("role", "alert");
  status.textContent = error instanceof Error ? error.message : String(error);
  console.error(error);
  window.clearInterval(poll);
  report();
}
async function load() {
  const response = await fetch("/scene", { cache: "no-store" });
  if (!response.ok) throw new Error(await response.text());
  payload = await response.json();
  if (!payload) throw new Error("Missing scene payload");
  house = uploadHouse(payload);
  scene.add(house);
  outline = new THREE.Box3Helper(new THREE.Box3().setFromObject(house), 0x26725a);
  outline.visible = false;
  scene.add(outline);
  for (const space of payload.environment.spaces) spaceSelect.add(new Option(space.id + " · " + space.kind, space.id));
  selectSpace();
  reset();
  status.textContent = "현재 source의 3D 검사 도구 · 건물 및 관찰 집합 승인 미완료";
  async function checkBasis() {
    try {
      const latest = await fetch("/basis", { cache: "no-store" });
      if (!latest.ok) throw new Error(await latest.text());
      const value = await latest.json();
      if (value.basis !== payload?.basis) throw new Error("Source 기준이 변경되었습니다. 조정자 재시작이 필요합니다.");
    } catch (error) { fail(error); }
  }
  poll = window.setInterval(() => { void checkBasis(); }, 3000);
}
inspection.addEventListener("change", () => {
  stationSelect.disabled = !inspection.checked;
  if (outline) outline.visible = inspection.checked;
  report();
});
spaceSelect.addEventListener("change", selectSpace);
stationSelect.addEventListener("change", selectStation);
required("#reset", HTMLButtonElement).addEventListener("click", reset);
controls.addEventListener("start", () => { observation = "free"; observationSpace = null; report(); });
canvas.addEventListener("webglcontextlost", (event) => { event.preventDefault(); fail(new Error("WebGL context lost. Reload after restoring the GPU context.")); });
controls.addEventListener("change", report);
canvas.addEventListener("keydown", (event) => {
  if (!running) return;
  const offset = camera.position.clone().sub(controls.target);
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
    const horizontal = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
    const vertical = event.key === "ArrowUp" ? 1 : event.key === "ArrowDown" ? -1 : 0;
    if (event.shiftKey) {
      const shift = new THREE.Vector3(horizontal * 0.15, vertical * 0.15, 0).applyQuaternion(camera.quaternion);
      camera.position.add(shift); controls.target.add(shift);
    } else {
      const spherical = new THREE.Spherical().setFromVector3(offset);
      spherical.theta += horizontal * 0.06; spherical.phi -= vertical * 0.06; spherical.makeSafe();
      camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
    }
  } else if (event.key === "+" || event.key === "=" || event.key === "-") {
    camera.position.copy(controls.target).add(offset.multiplyScalar(event.key === "-" ? 1.1 : 0.9));
  } else if (event.key.toLowerCase() === "r") reset();
  else return;
  event.preventDefault(); observation = "free"; observationSpace = null; controls.update(); report();
});
function draw() {
  if (!running) return;
  try {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (width && height) {
    if (canvas.width !== width || canvas.height !== height) renderer.setSize(width, height, false);
    camera.aspect = width / height; camera.updateProjectionMatrix();
    renderer.render(scene, camera); gl.finish();
  }
  requestAnimationFrame(draw);
  } catch (error) { fail(error); }
}
Object.assign(window, { houseViewer: {
  renderer: () => hardware,
  basis: () => payload?.basis ?? null,
  valid: () => running && house !== null,
  /** @param {number} x @param {number} y @param {number} width @param {number} height */
  readPixels: (x, y, width, height) => { if (!running || !house) throw new Error("No current frame"); const pixels = new Uint8Array(width * height * 4); gl.finish(); gl.readPixels(x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels); return Array.from(pixels); },
} });
window.addEventListener("pagehide", () => {
  running = false; window.clearInterval(poll); controls.dispose();
  if (house) disposeHouse(house);
  outline?.geometry.dispose();
  if (outline && !Array.isArray(outline.material)) outline.material.dispose();
  renderer.dispose();
});
try { await load(); draw(); } catch (error) { fail(error); }
}
void start().catch((error) => {
  const canvas = document.querySelector("canvas");
  if (canvas) canvas.hidden = true;
  const status = document.querySelector("#status");
  if (status) { status.setAttribute("role", "alert"); status.textContent = error instanceof Error ? error.message : String(error); }
  console.error(error);
});
