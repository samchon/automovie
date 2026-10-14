// @ts-check
/**
 * Temple viewer client, drawing only the server's current-source payload.
 * It uses the source perspective lens, configured daylight direction (upper
 * front left, elevation 45°), sky fill, soft shadows and depth. Labels,
 * supports, owner colors and cutaways are inspection displays. Vertical
 * sections cut an X or Z plane and draw exact server-computed solid pieces
 * and ground lines; orthographic projection and a 0.5 m grid reveal height.
 * Loading failure clears the scene and displays the error.
 */
import * as THREE from "three";
import type { ViewerPayload } from "./payload";
import type { SectionPayload } from "./section";
import type { ReviewPayload } from "../review/review-payload";
import type { IAncientTempleViewer } from "./IAncientTempleViewer";
interface LoadedTemple extends ReturnType<typeof uploadTemple> {
  payload: ViewerPayload;
  basis: string;
  supports: THREE.Group;
  textures: Map<string, THREE.Texture>;
}
interface TempleSource { basis: string; payload: ViewerPayload; }
interface TempleSectionRequest { axis: "x" | "z"; offset: number; flip: boolean; }
interface SectionShown { key: string; pieces: number; }
interface Point3 { x: number; y: number; z: number; }
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createTemplePresentation } from "./daylight";
import { isTempleRoofCovering } from "./inspection-visibility";
import { disposeTree, loadTempleTextures, uploadSupports, uploadTemple } from "./scene";

/** @typedef {import("./payload.js").ViewerPayload} Payload */
/** @typedef {Payload["observations"][number]} Observation */

/**
 * @param {string} selector
 */
function required<T extends Element>(selector: string, kind: new () => T): T {
  const value = document.querySelector(selector);
  if (!(value instanceof kind)) throw new Error(`Missing viewer control: ${selector}`);
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
const sectionOffset = required("#section-offset", HTMLInputElement);
const sectionFlip = required("#section-flip", HTMLInputElement);
const sectionOrtho = required("#section-ortho", HTMLInputElement);
const sectionSpan = required("#section-span", HTMLInputElement);
const reset = required("#reset", HTMLButtonElement);
const details = required("#details", HTMLElement);
const reviewLoad = required("#review-load", HTMLButtonElement);
const reviewOutput = required("#review", HTMLElement);
const notices = required("#notices", HTMLElement);
const spaceList = required("#space-list", HTMLElement);
const labels = required("#labels", HTMLElement);

const { renderer, rendererName, scene } = createTemplePresentation(canvas);
console.info("RENDERER", rendererName);

const camera = new THREE.PerspectiveCamera();
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = false;
controls.maxDistance = 160;
let current: LoadedTemple | null = null;
let station: ViewerPayload["observations"][number] | null = null;
const planCut = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1.2);
const verticalCut = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
const orthoCamera = new THREE.OrthographicCamera(-6.4, 6.4, 4, -4, 0.05, 200);
// Inspection grid on the section plane: 0.5 m spacing, dark at 1 m, red at Y=0 and the plane origin.
const sectionGrid = new THREE.Group();
sectionGrid.name = "section-grid";
for (const [divisions, center, color, opacity] of [[80, 0x9fb3c8, 0x9fb3c8, 0.35], [40, 0xc0392b, 0x2f5f8f, 0.75]]) {
  const grid = new THREE.GridHelper(40, divisions, center, color);
  const materials = Array.isArray(grid.material) ? grid.material : [grid.material];
  for (const material of materials) Object.assign(material, { transparent: true, opacity, depthWrite: false });
  sectionGrid.add(grid);
}
sectionGrid.visible = false;
scene.add(sectionGrid);
const sectionShapes = new THREE.Group();
sectionShapes.name = "section-pieces";
scene.add(sectionShapes);
/** Section fill colors by piece kind, for inspection rather than materials. */
const sectionColors = { wall: 0x7a3b2e, roof: 0x3d4a57, trim: 0xc9a227, floor: 0x5b6b3a };
let sectionShown: SectionShown | null = null;
let sectionRequest = 0;

/**
 * Convert the server section into plane shapes, placed 1 mm inside the retained
 * side to cover cut interiors. Gaps leave blank spaces; overlaps stack pieces.
 * @param {{ axis: "x" | "z", offset: number, flip: boolean }} cut
 */
async function loadSection(cut: TempleSectionRequest) {
  const key = `${cut.axis}:${cut.offset}:${cut.flip}`;
  if (sectionShown?.key === key) return;
  const request = ++sectionRequest;
  const response = await fetch(`/section?axis=${cut.axis}&offset=${cut.offset}`, { cache: "no-store" });
  if (!response.ok) {
    fail(`Section HTTP ${response.status}
${await response.text()}`);
    return;
  }
  const body: SectionPayload = await response.json();
  if (request !== sectionRequest) return;
  disposeTree(sectionShapes);
  sectionShapes.clear();
  const inset = cut.flip ? 0.001 : -0.001;
  /** @param {number} u @param {number} y */
  const world = (u: number, y: number) => cut.axis === "x" ? new THREE.Vector3(cut.offset + inset, y, u) : new THREE.Vector3(u, y, cut.offset + inset);
  for (const piece of body.pieces) {
    const corners = piece.points.map((p) => world(p.u, p.y));
    const [c0, c1, c2, c3] = corners;
    if (c0 === undefined || c1 === undefined || c2 === undefined || c3 === undefined) continue;
    const fill = new THREE.BufferGeometry().setFromPoints([c0, c1, c2, c0, c2, c3]);
    const mesh = new THREE.Mesh(fill, new THREE.MeshBasicMaterial({ color: sectionColors[piece.kind], side: THREE.DoubleSide }));
    mesh.name = piece.group;
    sectionShapes.add(mesh);
    const outline = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(corners), new THREE.LineBasicMaterial({ color: 0x111111 }));
    sectionShapes.add(outline);
  }
  for (const line of body.ground) {
    const points = line.map((p) => world(p.u, p.y));
    sectionShapes.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: 0x2e7d32 })));
  }
  sectionShown = { key, pieces: body.pieces.length };
  handle.sectionPieces = body.pieces.length;
  handle.sectionKey = key;
  describe();
}

/** Vertical section settings: axis, position, retained side and orthographic view. */
function cutState() {
  const axis: "x" | "z" | null = section.value === "cut-x" ? "x" : section.value === "cut-z" ? "z" : null;
  const offset = Number(sectionOffset.value);
  return {
    axis, offset: Number.isFinite(offset) ? offset : 0, flip: sectionFlip.checked,
    ortho: sectionOrtho.checked, span: Math.max(0.5, Number(sectionSpan.value) || 4),
  };
}

const handle: IAncientTempleViewer = { ready: false, renderer: rendererName, error: null, stations: [], sectionPieces: null, sectionKey: null, select: (id) => selectStation(id), look: (position, target) => look(position, target) };
Object.assign(window, { templeViewer: handle });

/** @param {string} message */
function fail(message: string) {
  handle.error = message;
  handle.ready = false;
  if (current !== null) {
    scene.remove(current.root, current.supports);
    disposeTree(current.root);
    disposeTree(current.supports);
    for (const texture of current.textures.values()) texture.dispose();
    current = null;
  }
  banner.hidden = false;
  banner.textContent = `Could not load current source. An earlier scene will not be displayed.\n${message}`;
  status.textContent = "Error: current source failed to load";
}

async function load() {
  status.textContent = "Loading current source.";
  const response = await fetch("/scene", { cache: "no-store" });
  if (!response.ok) {
    fail(`HTTP ${response.status}\n${await response.text()}`);
    return;
  }
  const body: TempleSource = await response.json();
  camera.fov = body.payload.lens.verticalDegrees;
  camera.aspect = body.payload.lens.aspect;
  camera.near = body.payload.lens.near;
  camera.far = body.payload.lens.far;
  camera.updateProjectionMatrix();
  const textures = await loadTempleTextures(body.payload);
  const uploaded = uploadTemple(body.payload, textures);
  const supports = uploadSupports(body.payload);
  supports.visible = false;
  if (current !== null) {
    scene.remove(current.root, current.supports);
    disposeTree(current.root);
    disposeTree(current.supports);
    for (const texture of current.textures.values()) texture.dispose();
  }
  current = { payload: body.payload, basis: body.basis, supports, textures, ...uploaded };
  scene.add(uploaded.root, supports);
  banner.hidden = true;
  populate(body.payload);
  const census = body.payload.census;
  status.textContent = `source ${body.basis} · RENDERER ${rendererName} · models ${census.models} · triangles ${census.triangles} · observations ${body.payload.observations.length}`;
  notices.replaceChildren(...body.payload.notices.map((text) => Object.assign(document.createElement("li"), { textContent: text })));
  applyInspection();
  const requested = params.get("station");
  if (requested === null || !selectStation(requested)) selectStation("exterior.setting");
  // ?camera=x,y,z&target=x,y,z reproduces recorded free views for defects outside the observation list.
  const camera3 = parseVector(params.get("camera"));
  const target3 = parseVector(params.get("target"));
  if (camera3 !== null && target3 !== null) {
    camera.position.set(...camera3);
    controls.target.set(...target3);
    camera.lookAt(controls.target);
    controls.update();
    describe();
  }
  handle.stations = body.payload.observations.map((o) => o.id);
  handle.error = null;
  handle.ready = true;
}

/**
 * Read an "x,y,z" string as three finite numbers; return null for invalid input.
 * @param {string | null} text
 * @returns {[number, number, number] | null}
 */
function parseVector(text: string | null): [number, number, number] | null {
  if (text === null) return null;
  const values = text.split(",").map(Number);
  return values.length === 3 && values.every(Number.isFinite) ? [values[0], values[1], values[2]] : null;
}

/** @param {Payload} payload */
function populate(payload: ViewerPayload) {
  spaceSelect.replaceChildren(new Option("All exterior", ""), ...payload.spaces.map((s) => new Option(s.name, s.id)));
  refillStations(payload);
  spaceList.replaceChildren(...payload.spaces.map((s) => {
    const item = document.createElement("li");
    const count = payload.observations.filter((o) => o.space === s.id).length;
    item.textContent = `${s.name}(${s.id}): cells ${s.cellCount}, observations ${count}`;
    return item;
  }));
}

/** @param {Payload} payload */
function refillStations(payload: ViewerPayload) {
  const space = spaceSelect.value;
  const outside = ["exterior", "junction", "section", "reference"];
  const list = payload.observations.filter((o) => space === "" ? outside.includes(o.group) : o.space === space);
  stationSelect.replaceChildren(...list.map((o) => new Option(`${o.label}${o.position === null ? " (no pose)" : ""}`, o.id)));
}

let viewApplied = false;
/**
 * Apply the observation's section or cutaway view; clear it when the next observation has none.
 * @param {Observation} observation
 */
function applyView(observation: ViewerPayload["observations"][number]) {
  const view = observation.view;
  if (view !== undefined) {
    inspection.checked = true;
    section.value = view.section;
    sectionOffset.value = String(view.offset);
    sectionFlip.checked = view.flip;
    sectionOrtho.checked = view.ortho;
    sectionSpan.value = String(view.span);
    viewApplied = true;
    applyInspection();
  } else if (viewApplied) {
    section.value = "none";
    sectionOrtho.checked = false;
    inspection.checked = params.get("inspect") === "1";
    viewApplied = false;
    applyInspection();
  }
}

/** @param {string} id */
function selectStation(id: string) {
  const observation = current?.payload.observations.find((o) => o.id === id);
  if (observation === undefined || observation.position === null || observation.target === null) return false;
  station = observation;
  const space = observation.space ?? "";
  if (spaceSelect.value !== space && current !== null) {
    spaceSelect.value = space;
    refillStations(current.payload);
  }
  stationSelect.value = id;
  applyView(observation);
  camera.position.set(observation.position.x, observation.position.y, observation.position.z);
  const direction = new THREE.Vector3(observation.target.x - observation.position.x,
    observation.target.y - observation.position.y, observation.target.z - observation.position.z);
  // Indoor observations keep the target near the eye so orbit controls turn in place.
  const reach = observation.group === "space" ? 0.4 : direction.length();
  controls.target.copy(camera.position).add(direction.normalize().multiplyScalar(reach));
  camera.lookAt(controls.target);
  controls.update();
  describe();
  return true;
}

/**
 * Free inspection view outside the observation list; record its coordinates.
 * @param {number[]} position @param {number[]} target
 */
function look(position: number[], target: number[]) {
  if (position.length !== 3 || target.length !== 3) return false;
  camera.position.set(position[0] ?? 0, position[1] ?? 0, position[2] ?? 0);
  controls.target.set(target[0] ?? 0, target[1] ?? 0, target[2] ?? 0);
  camera.lookAt(controls.target);
  controls.update();
  station = null;
  details.textContent = `Free view (outside the observation list)
Camera: (${position.join(", ")})
target: (${target.join(", ")})`;
  return true;
}

function describe() {
  if (station === null) return;
  const f = (v: Point3) => `(${v.x.toFixed(2)}, ${v.y.toFixed(2)}, ${v.z.toFixed(2)})`;
  details.textContent = [
    `Observation: ${station.id}`, `Name: ${station.label}`, `Role: ${station.role}`,
    `Camera: ${f(camera.position)}`, `target: ${f(controls.target)}`, `Lens: vertical ${camera.fov}°, aspect ${camera.aspect.toFixed(2)}`,
    `Mode: ${inspection.checked ? `Inspection (${section.value})` : "Delivery view"}`,
    sectionLine(),
    station.note === null ? "" : `Note: ${station.note}`,
  ].filter((line) => line.length > 0).join("\n");
}

function sectionLine() {
  const cut = cutState();
  if (!inspection.checked || cut.axis === null) return "";
  const kept = cut.flip ? "greater side" : "lesser side";
  const pieces = sectionShown === null ? "loading" : `${sectionShown.pieces} pieces (walls red-brown, roof blue-gray, coping/plinth yellow, floors green, ground line green)`;
  return `Section: ${cut.axis.toUpperCase()}=${cut.offset.toFixed(2)}m, retaining ${kept}${cut.ortho ? `, orthographic half-height ${cut.span.toFixed(1)}m` : ""}, ${pieces}`;
}

/** Orthographic section camera looking normally at controls.target from the removed side. */
function orthoFrame() {
  const cut = cutState();
  if (!inspection.checked || cut.axis === null || !cut.ortho) return null;
  const aspect = canvas.width / Math.max(1, canvas.height);
  Object.assign(orthoCamera, { left: -cut.span * aspect, right: cut.span * aspect, top: cut.span, bottom: -cut.span });
  orthoCamera.updateProjectionMatrix();
  const side = cut.flip ? -1 : 1;
  const target = controls.target;
  const at = new THREE.Vector3(cut.axis === "x" ? cut.offset : target.x, target.y, cut.axis === "z" ? cut.offset : target.z);
  orthoCamera.position.set(at.x + (cut.axis === "x" ? side * 60 : 0), at.y, at.z + (cut.axis === "z" ? side * 60 : 0));
  orthoCamera.lookAt(at);
  return orthoCamera;
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
  const cut = cutState();
  const cutting = on && cut.axis !== null;
  for (const input of [sectionOffset, sectionFlip, sectionOrtho, sectionSpan]) input.disabled = !cutting;
  if (cutting) {
    // Retain lesser coordinates by default, viewing from greater coordinates; flip for the other side.
    const sign = cut.flip ? 1 : -1;
    verticalCut.normal.set(cut.axis === "x" ? sign : 0, 0, cut.axis === "z" ? sign : 0);
    verticalCut.constant = -sign * cut.offset;
    sectionGrid.rotation.set(0, 0, 0);
    if (cut.axis === "x") sectionGrid.rotation.z = Math.PI / 2;
    else sectionGrid.rotation.x = Math.PI / 2;
    // Place the grid just inside the retained side so the cutting plane does not clip it.
    const toward = cut.flip ? 0.004 : -0.004;
    sectionGrid.position.set(cut.axis === "x" ? cut.offset + toward : 0, 0, cut.axis === "z" ? cut.offset + toward : 0);
  }
  sectionGrid.visible = cutting;
  sectionShapes.visible = cutting;
  renderer.clippingPlanes = on && section.value === "plan-cut" ? [planCut] : cutting ? [verticalCut] : [];
  if (cutting && cut.axis !== null) {
    loadSection({ axis: cut.axis, offset: cut.offset, flip: cut.flip })
      .catch((error) => fail(error instanceof Error ? error.message : String(error)));
  }
  for (const mesh of current.meshes) {
    const model = String(mesh.userData.model);
    mesh.visible = !(roofOff && isTempleRoofCovering(model));
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
  renderer.render(scene, orthoFrame() ?? camera);
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
for (const input of [inspection, section, owners, supportsToggle, sectionOffset, sectionFlip, sectionOrtho, sectionSpan]) {
  input.addEventListener("change", applyInspection);
}
reset.addEventListener("click", () => selectStation(station?.id ?? "exterior.setting"));
reviewLoad.addEventListener("click", () => {
  loadReview().catch((error) => { reviewOutput.textContent = `Review failed: ${error instanceof Error ? error.message : String(error)}`; });
});

/** Show /review measurements from the self-check producer as text alongside colors. */
async function loadReview() {
  reviewLoad.disabled = true;
  reviewOutput.textContent = "Measuring current source.";
  try {
    const response = await fetch("/review?grid=0.01", { cache: "no-store" });
    if (!response.ok) throw new Error(await response.text());
    const review: ReviewPayload = await response.json();
    const revision = review.revision === null ? "unverified" : `${review.revision.commit.slice(0, 8)}${review.revision.dirty ? " (dirty)" : ""}`;
    const lines = [
      `source ${review.basis} · revision ${revision}`,
      `Overlap scan: ${review.overlaps.solids} solids, ${review.overlaps.grid} m grid, ${review.overlaps.samples} samples → ${review.overlaps.pairs.length} overlapping pairs`,
      `Observations ${review.observations.count} (${review.observations.withoutPose} without pose), buried poses ${review.observations.buried.length}`,
      `Topology ledger ${review.ledger.length} rows, ${review.ledger.filter((row) => row.findings.length > 0).length} contract violations`,
      ...review.ledger.map(({ account: a, contract, findings }) =>
        `${findings.length > 0 ? "VIOLATION" : "PASS"} ${a.id} [${contract}] triangles ${a.triangles}, open edges ${a.openEdges}, non-manifold ${a.nonManifoldEdges}/${a.resolvedNonManifold}, winding ${a.windingErrors}, components ${a.components}, volume ${a.volume.toFixed(3)}${findings.length > 0 ? ` — ${findings.join("; ")}` : ""}`),
    ];
    reviewOutput.textContent = lines.join("\n");
  } finally {
    reviewLoad.disabled = false;
  }
}
controls.addEventListener("change", describe);
canvas.addEventListener("keydown", (event) => {
  const offset = camera.position.clone().sub(controls.target);
  const spherical = new THREE.Spherical().setFromVector3(offset);
  const step = 0.08;
  if (event.key === "r" || event.key === "R") selectStation(station?.id ?? "exterior.setting");
  else if ((event.key === "+" || event.key === "=") && orthoFrame() !== null) sectionSpan.value = String(cutState().span * 0.9);
  else if (event.key === "-" && orthoFrame() !== null) sectionSpan.value = String(cutState().span * 1.1);
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
if (params.get("offset") !== null) sectionOffset.value = String(params.get("offset"));
if (params.get("flip") === "1") sectionFlip.checked = true;
if (params.get("ortho") === "1") sectionOrtho.checked = true;
if (params.get("span") !== null) sectionSpan.value = String(params.get("span"));
requestAnimationFrame(frame);
load().catch((error) => fail(error instanceof Error ? error.stack ?? error.message : String(error)));
