// @ts-check
/**
 * 신전 뷰어 클라이언트. 서버가 현재 source로 만든 payload만 그린다.
 * 원근 카메라(수직 50°), 설정의 주광 방향(정면 좌측 위, 고도 45°)과 하늘
 * 보조광, 부드러운 그림자, 깊이를 쓴다. 라벨·support·표면 소유 색·절개는
 * 검사 모드에서만 켠다. 불러오기 실패 시 장면을 비우고 오류를 표시한다.
 */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { disposeTree, uploadSupports, uploadTemple } from "./scene.mjs";

/** @typedef {import("./payload.js").ViewerPayload} Payload */
/** @typedef {Payload["observations"][number]} Observation */

/**
 * @template {Element} T
 * @param {string} selector
 * @param {new () => T} kind
 * @returns {T}
 */
function required(selector, kind) {
  const value = document.querySelector(selector);
  if (!(value instanceof kind)) throw new Error(`뷰어 조작부 누락: ${selector}`);
  return value;
}

const params = new URL(location.href).searchParams;
if (params.get("capture") === "1") document.body.classList.add("capture");
const canvas = required("canvas", HTMLCanvasElement);
const status = required("#status", HTMLElement);
const banner = required("#error", HTMLElement);
const spaceSelect = required("#space", HTMLSelectElement);
const stationSelect = required("#station", HTMLSelectElement);
const inspection = required("#inspection", HTMLInputElement);
const section = required("#section", HTMLSelectElement);
const owners = required("#owners", HTMLInputElement);
const supportsToggle = required("#supports", HTMLInputElement);
const reset = required("#reset", HTMLButtonElement);
const details = required("#details", HTMLElement);
const notices = required("#notices", HTMLElement);
const spaceList = required("#space-list", HTMLElement);
const labels = required("#labels", HTMLElement);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.localClippingEnabled = true;
const gl = renderer.getContext();
const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
const rendererName = debugInfo ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)) : "unverified: WEBGL_debug_renderer_info 없음";
console.info("RENDERER", rendererName);

const scene = new THREE.Scene();
scene.background = skyTexture();
const camera = new THREE.PerspectiveCamera(50, 1.6, 0.05, 400);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = false;
controls.maxDistance = 160;
const hemisphere = new THREE.HemisphereLight(0xe3ecf7, 0x9c8a6c, 1.15);
const sun = new THREE.DirectionalLight(0xfff1dc, 3.1);
// 설정 40-environment#daylight: 정면(+Z) 좌측(-X) 위, 고도 45°.
const sunDirection = new THREE.Vector3(-0.5, Math.SQRT1_2, 0.5).normalize();
sun.position.copy(sunDirection).multiplyScalar(45);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, { left: -17, right: 17, top: 17, bottom: -17, near: 1, far: 100 });
sun.shadow.bias = -0.0002;
sun.shadow.normalBias = 0.02;
scene.add(hemisphere, sun, sun.target);

/** @type {{ payload: Payload, basis: string, root: THREE.Group, supports: THREE.Group, meshes: THREE.Mesh[], ownerMaterials: Map<string, THREE.Material>, beautyMaterials: Map<THREE.Mesh, THREE.Material> } | null} */
let current = null;
/** @type {Observation | null} */
let station = null;
const planCut = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1.2);

/** @type {{ ready: boolean, renderer: string, error: string | null, stations: string[], select: (id: string) => boolean, look: (position: number[], target: number[]) => boolean }} */
const handle = { ready: false, renderer: rendererName, error: null, stations: [], select: (id) => selectStation(id), look: (position, target) => look(position, target) };
Object.assign(window, { templeViewer: handle });

/** @param {string} message */
function fail(message) {
  handle.error = message;
  handle.ready = false;
  if (current !== null) {
    scene.remove(current.root, current.supports);
    disposeTree(current.root);
    disposeTree(current.supports);
    current = null;
  }
  banner.hidden = false;
  banner.textContent = `현재 source를 불러오지 못했습니다. 이전 화면은 표시하지 않습니다.\n${message}`;
  status.textContent = "오류: 현재 source 불러오기 실패";
}

async function load() {
  status.textContent = "현재 source를 불러오는 중입니다.";
  const response = await fetch("/scene", { cache: "no-store" });
  if (!response.ok) {
    fail(`HTTP ${response.status}\n${await response.text()}`);
    return;
  }
  /** @type {{ basis: string, payload: Payload }} */
  const body = await response.json();
  const uploaded = uploadTemple(body.payload);
  const supports = uploadSupports(body.payload);
  supports.visible = false;
  if (current !== null) {
    scene.remove(current.root, current.supports);
    disposeTree(current.root);
    disposeTree(current.supports);
  }
  current = { payload: body.payload, basis: body.basis, supports, ...uploaded };
  scene.add(uploaded.root, supports);
  banner.hidden = true;
  populate(body.payload);
  const census = body.payload.census;
  status.textContent = `source ${body.basis} · RENDERER ${rendererName} · model ${census.models} · 삼각형 ${census.triangles} · 관찰 ${body.payload.observations.length}`;
  notices.replaceChildren(...body.payload.notices.map((text) => Object.assign(document.createElement("li"), { textContent: text })));
  applyInspection();
  const requested = params.get("station");
  if (requested === null || !selectStation(requested)) selectStation("exterior.setting");
  handle.stations = body.payload.observations.map((o) => o.id);
  handle.error = null;
  handle.ready = true;
}

/** @param {Payload} payload */
function populate(payload) {
  spaceSelect.replaceChildren(new Option("외부 전체", ""), ...payload.spaces.map((s) => new Option(s.name, s.id)));
  refillStations(payload);
  spaceList.replaceChildren(...payload.spaces.map((s) => {
    const item = document.createElement("li");
    const count = payload.observations.filter((o) => o.space === s.id).length;
    item.textContent = `${s.name}(${s.id}): cell ${s.cellCount}, 관찰 ${count}`;
    return item;
  }));
}

/** @param {Payload} payload */
function refillStations(payload) {
  const space = spaceSelect.value;
  const list = payload.observations.filter((o) => space === "" ? o.group === "exterior" : o.space === space);
  stationSelect.replaceChildren(...list.map((o) => new Option(`${o.label}${o.position === null ? " (pose 없음)" : ""}`, o.id)));
}

/** @param {string} id */
function selectStation(id) {
  const observation = current?.payload.observations.find((o) => o.id === id);
  if (observation === undefined || observation.position === null || observation.target === null) return false;
  station = observation;
  const space = observation.space ?? "";
  if (spaceSelect.value !== space && current !== null) {
    spaceSelect.value = space;
    refillStations(current.payload);
  }
  stationSelect.value = id;
  camera.position.set(observation.position.x, observation.position.y, observation.position.z);
  const direction = new THREE.Vector3(observation.target.x - observation.position.x,
    observation.target.y - observation.position.y, observation.target.z - observation.position.z);
  // 실내 관찰은 target을 눈앞 가까이 두어 궤도 조작이 제자리 둘러보기가 되게 한다.
  const reach = observation.group === "space" ? 0.4 : direction.length();
  controls.target.copy(camera.position).add(direction.normalize().multiplyScalar(reach));
  camera.lookAt(controls.target);
  controls.update();
  describe();
  return true;
}

/**
 * 검사용 자유 시점. 관찰 목록에 없는 위치이며 기록할 때는 좌표를 함께 남긴다.
 * @param {number[]} position @param {number[]} target
 */
function look(position, target) {
  if (position.length !== 3 || target.length !== 3) return false;
  camera.position.set(position[0] ?? 0, position[1] ?? 0, position[2] ?? 0);
  controls.target.set(target[0] ?? 0, target[1] ?? 0, target[2] ?? 0);
  camera.lookAt(controls.target);
  controls.update();
  station = null;
  details.textContent = `자유 시점(관찰 목록 밖)
카메라: (${position.join(", ")})
target: (${target.join(", ")})`;
  return true;
}

function describe() {
  if (station === null) return;
  const f = (/** @type {{x:number,y:number,z:number}} */ v) => `(${v.x.toFixed(2)}, ${v.y.toFixed(2)}, ${v.z.toFixed(2)})`;
  details.textContent = [
    `관찰: ${station.id}`, `이름: ${station.label}`, `역할: ${station.role}`,
    `카메라: ${f(camera.position)}`, `target: ${f(controls.target)}`, "렌즈: 수직 50°, 1600×1000 비교 프레임",
    `모드: ${inspection.checked ? `검사(${section.value})` : "납품 보기"}`,
    station.note === null ? "" : `메모: ${station.note}`,
  ].filter((line) => line.length > 0).join("\n");
}

function applyInspection() {
  if (current === null) return;
  const on = inspection.checked;
  section.disabled = !on;
  owners.disabled = !on;
  supportsToggle.disabled = !on;
  labels.hidden = !on;
  current.supports.visible = on && supportsToggle.checked;
  const roofOff = on && section.value === "roof-off";
  renderer.clippingPlanes = on && section.value === "plan-cut" ? [planCut] : [];
  for (const mesh of current.meshes) {
    const model = String(mesh.userData.model);
    mesh.visible = !(roofOff && (model.startsWith("model.roof") || model === "model.ceilings"));
    const surface = String(mesh.userData.surface);
    mesh.material = on && owners.checked
      ? current.ownerMaterials.get(surface) ?? mesh.material
      : current.beautyMaterials.get(mesh) ?? mesh.material;
  }
  describe();
}

function resize() {
  const width = document.body.classList.contains("capture") ? 1600 : canvas.clientWidth;
  const height = document.body.classList.contains("capture") ? 1000 : canvas.clientHeight;
  if (canvas.width !== width || canvas.height !== height) {
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
}

function drawLabels() {
  if (labels.hidden || current === null) return;
  const rect = canvas.getBoundingClientRect();
  const nodes = current.payload.observations.filter((o) => o.role === "center" && o.id.endsWith("center-x-minus") && o.position !== null);
  labels.replaceChildren(...nodes.map((o) => {
    const p = new THREE.Vector3(o.position?.x ?? 0, (o.position?.y ?? 0) + 0.6, o.position?.z ?? 0).project(camera);
    const el = document.createElement("span");
    el.textContent = current?.payload.spaces.find((s) => s.id === o.space)?.name ?? String(o.space);
    el.style.left = `${rect.left + (p.x + 1) / 2 * rect.width}px`;
    el.style.top = `${rect.top + (1 - p.y) / 2 * rect.height}px`;
    el.hidden = p.z > 1;
    return el;
  }));
}

function frame() {
  resize();
  renderer.render(scene, camera);
  drawLabels();
  requestAnimationFrame(frame);
}

spaceSelect.addEventListener("change", () => {
  if (current === null) return;
  refillStations(current.payload);
  const first = stationSelect.options[0];
  if (first !== undefined) selectStation(first.value);
});
stationSelect.addEventListener("change", () => selectStation(stationSelect.value));
for (const input of [inspection, section, owners, supportsToggle]) input.addEventListener("change", applyInspection);
reset.addEventListener("click", () => selectStation(station?.id ?? "exterior.setting"));
controls.addEventListener("change", describe);
canvas.addEventListener("keydown", (event) => {
  const offset = camera.position.clone().sub(controls.target);
  const spherical = new THREE.Spherical().setFromVector3(offset);
  const step = 0.08;
  if (event.key === "r" || event.key === "R") selectStation(station?.id ?? "exterior.setting");
  else if (event.key === "+" || event.key === "=") spherical.radius *= 0.9;
  else if (event.key === "-") spherical.radius *= 1.1;
  else if (!event.shiftKey && event.key === "ArrowLeft") spherical.theta += step;
  else if (!event.shiftKey && event.key === "ArrowRight") spherical.theta -= step;
  else if (!event.shiftKey && event.key === "ArrowUp") spherical.phi = Math.max(0.05, spherical.phi - step);
  else if (!event.shiftKey && event.key === "ArrowDown") spherical.phi = Math.min(Math.PI - 0.05, spherical.phi + step);
  else if (event.shiftKey && event.key.startsWith("Arrow")) {
    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0);
    const forward = new THREE.Vector3().subVectors(controls.target, camera.position).setY(0).normalize();
    const move = event.key === "ArrowLeft" ? right.multiplyScalar(-0.5) : event.key === "ArrowRight" ? right.multiplyScalar(0.5)
      : event.key === "ArrowUp" ? forward.multiplyScalar(0.5) : forward.multiplyScalar(-0.5);
    camera.position.add(move);
    controls.target.add(move);
    controls.update();
    event.preventDefault();
    return;
  } else return;
  event.preventDefault();
  camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
  controls.update();
});
window.addEventListener("error", (event) => fail(String(event.message)));
window.addEventListener("unhandledrejection", (event) => fail(String(event.reason)));

if (params.get("inspect") === "1") inspection.checked = true;
const requestedSection = params.get("section");
if (requestedSection !== null) section.value = requestedSection;
requestAnimationFrame(frame);
load().catch((error) => fail(error instanceof Error ? error.stack ?? error.message : String(error)));

/** 위가 밝고 수평선이 옅은 하늘 배경(조명원이 아닌 배경색). */
function skyTexture() {
  const size = 256;
  const surface = document.createElement("canvas");
  surface.width = 2;
  surface.height = size;
  const context = surface.getContext("2d");
  if (context === null) return new THREE.Color(0xb9d0e6);
  const gradient = context.createLinearGradient(0, 0, 0, size);
  gradient.addColorStop(0, "#7fa7cf");
  gradient.addColorStop(0.55, "#bcd3e8");
  gradient.addColorStop(1, "#e6e2d6");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 2, size);
  const texture = new THREE.CanvasTexture(surface);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
