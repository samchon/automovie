const MATERIAL_COLORS = {
  "paint-warm-white": "#eee9df",
  "siding-white": "#d9d8d0",
  "brick-red-brown": "#8b5844",
  "roof-charcoal": "#34383a",
  "trim-white": "#f6f2e9",
  "glass-smoke": "#6e7a7a",
  "door-walnut": "#5e3825",
  "metal-black": "#202426",
  "wood-oak": "#b58452",
  "wood-walnut": "#70442c",
  "carpet-warm-gray": "#aaa59a",
  "tile-pale": "#d7d1c4",
  "concrete-cool-gray": "#8b8c88",
  "cabinet-taupe": "#9d8e7e",
  "stone-pale": "#d2cbbd",
  "fabric-oatmeal": "#b4a590",
  "fabric-blue-gray": "#71808b",
  greenery: "#5c7148",
};

const MATERIAL_LABELS = {
  "siding-white": "백색 사이딩",
  "brick-red-brown": "적갈색 벽돌",
  "roof-charcoal": "차콜 지붕",
  "glass-smoke": "스모크 유리",
  "wood-oak": "오크 목재",
  "wood-walnut": "월넛 목재",
  "carpet-warm-gray": "웜그레이 카펫",
  "cabinet-taupe": "토프 수납장",
  "concrete-cool-gray": "쿨그레이 콘크리트",
  greenery: "식재",
};

const canvas = document.querySelector("#view");
const context = canvas.getContext("2d");
const status = document.querySelector("#status");
const storeySelect = document.querySelector("#storey");
const sectionSelect = document.querySelector("#section");
const focusSelect = document.querySelector("#focus");
const labelsInput = document.querySelector("#labels");
const stats = document.querySelector("#stats");
const legend = document.querySelector("#legend");
const resetButton = document.querySelector("#reset");

const state = {
  data: null,
  yaw: -0.78,
  pitch: 0.56,
  zoom: 1,
  target: { x: 2.3, y: 2.3, z: 0 },
  dragging: false,
  pan: false,
  previousPointer: { x: 0, y: 0 },
  frame: 0,
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const shade = (hex, factor) => {
  const value = hex.slice(1);
  const red = clamp(Math.round(Number.parseInt(value.slice(0, 2), 16) * factor), 0, 255);
  const greenValue = clamp(Math.round(Number.parseInt(value.slice(2, 4), 16) * factor), 0, 255);
  const blue = clamp(Math.round(Number.parseInt(value.slice(4, 6), 16) * factor), 0, 255);
  return `rgb(${red} ${greenValue} ${blue})`;
};

const resize = () => {
  const ratio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = Math.max(1, Math.round(width * ratio));
  canvas.height = Math.max(1, Math.round(height * ratio));
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  scheduleRender();
};

const sourceItems = () => {
  if (state.data === null) return [];
  const buildingItems = state.data.building.elements.map((element) => ({ ...element, origin: "building" }));
  const siteItems = state.data.site.elements.map((element) => ({ ...element, origin: "site" }));
  return [...buildingItems, ...siteItems];
};

const hasTag = (item, tag) => item.parts.some((part) => part.tags.includes(tag));

const visibleElement = (item) => {
  const storey = storeySelect.value;
  if (storey !== "all" && item.origin === "building" && item.storeyId !== null && item.storeyId !== storey) return false;
  const focus = focusSelect.value;
  if (focus !== "all" && item.layer === "fit-out" && item.spaceId !== focus) return false;
  const section = sectionSelect.value;
  if (section !== "full" && hasTag(item, "roof-slope")) return false;
  if (section === "cutaway") {
    if (item.surfaceOwnerId.includes("elevation.front") && (item.layer === "envelope" || item.layer === "opening" || item.layer === "module")) return false;
    if (hasTag(item, "exterior-wall") && item.parts.some((part) => part.center.z < -4.55)) return false;
  }
  return true;
};

const rotatePoint = (point, pitchDeg, yawDeg) => {
  const pitch = (pitchDeg * Math.PI) / 180;
  const yaw = (yawDeg * Math.PI) / 180;
  const yawX = point.x * Math.cos(yaw) - point.z * Math.sin(yaw);
  const yawZ = point.x * Math.sin(yaw) + point.z * Math.cos(yaw);
  return {
    x: yawX,
    y: point.y * Math.cos(pitch) - yawZ * Math.sin(pitch),
    z: point.y * Math.sin(pitch) + yawZ * Math.cos(pitch),
  };
};

const project = (point, view) => {
  const dx = point.x - state.target.x;
  const dy = point.y - state.target.y;
  const dz = point.z - state.target.z;
  const yawX = dx * Math.cos(state.yaw) - dz * Math.sin(state.yaw);
  const yawZ = dx * Math.sin(state.yaw) + dz * Math.cos(state.yaw);
  const up = dy * Math.cos(state.pitch) + yawZ * Math.sin(state.pitch);
  const depth = yawZ * Math.cos(state.pitch) - dy * Math.sin(state.pitch);
  return {
    x: view.centerX + yawX * view.scale,
    y: view.centerY - up * view.scale,
    depth,
  };
};

const partCorners = (part) => {
  const points = [];
  for (const x of [-0.5, 0.5]) {
    for (const y of [-0.5, 0.5]) {
      for (const z of [-0.5, 0.5]) {
        const rotated = rotatePoint({ x: x * part.size.x, y: y * part.size.y, z: z * part.size.z }, part.pitchDeg, part.rotationYDeg);
        points.push({ x: part.center.x + rotated.x, y: part.center.y + rotated.y, z: part.center.z + rotated.z });
      }
    }
  }
  return points;
};

const FACE_INDEXES = [
  [0, 4, 6, 2],
  [4, 5, 7, 6],
  [5, 1, 3, 7],
  [1, 0, 2, 3],
  [2, 6, 7, 3],
  [4, 0, 1, 5],
];

const partDrawables = () => sourceItems().filter(visibleElement).flatMap((element) => element.parts.map((part) => ({ element, part })));

const boundsForVisible = (drawables) => {
  const points = drawables.flatMap(({ part }) => partCorners(part));
  if (points.length === 0) return { min: { x: -12, y: 0, z: -8 }, max: { x: 14, y: 7, z: 9 } };
  return points.reduce((bounds, point) => ({
    min: { x: Math.min(bounds.min.x, point.x), y: Math.min(bounds.min.y, point.y), z: Math.min(bounds.min.z, point.z) },
    max: { x: Math.max(bounds.max.x, point.x), y: Math.max(bounds.max.y, point.y), z: Math.max(bounds.max.z, point.z) },
  }), { min: { ...points[0] }, max: { ...points[0] } });
};

const fitCamera = () => {
  const drawables = partDrawables();
  const bounds = boundsForVisible(drawables);
  state.target = {
    x: (bounds.min.x + bounds.max.x) / 2,
    y: (bounds.min.y + bounds.max.y) / 2,
    z: (bounds.min.z + bounds.max.z) / 2,
  };
  state.zoom = 0.88;
  scheduleRender();
};

const drawBackground = (width, height) => {
  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#293433");
  gradient.addColorStop(1, "#121819");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
};

const drawGround = (view) => {
  const size = 30;
  const points = [
    project({ x: -size, y: -0.24, z: -size }, view),
    project({ x: size, y: -0.24, z: -size }, view),
    project({ x: size, y: -0.24, z: size }, view),
    project({ x: -size, y: -0.24, z: size }, view),
  ];
  context.beginPath();
  points.forEach((point, index) => index === 0 ? context.moveTo(point.x, point.y) : context.lineTo(point.x, point.y));
  context.closePath();
  context.fillStyle = "#182221";
  context.fill();
  context.strokeStyle = "#30403b";
  context.lineWidth = 1;
  context.stroke();
};

const drawPart = (drawable, view) => {
  const corners = partCorners(drawable.part).map((point) => project(point, view));
  const base = MATERIAL_COLORS[drawable.part.material] ?? "#b8b8b0";
  const module = drawable.element.layer === "module";
  const faces = FACE_INDEXES.map((indexes, index) => ({
    indexes,
    depth: indexes.reduce((sum, corner) => sum + corners[corner].depth, 0) / indexes.length,
    factor: [0.76, 0.92, 0.61, 0.84, 1.08, 0.5][index],
  })).sort((left, right) => right.depth - left.depth);
  for (const face of faces) {
    context.beginPath();
    face.indexes.forEach((corner, index) => index === 0 ? context.moveTo(corners[corner].x, corners[corner].y) : context.lineTo(corners[corner].x, corners[corner].y));
    context.closePath();
    context.fillStyle = shade(base, face.factor);
    context.fill();
    if (!module) {
      context.strokeStyle = "rgba(8, 14, 14, .38)";
      context.lineWidth = 0.75;
      context.stroke();
    }
  }
};

const drawSpaceBounds = (space, view) => {
  const { min, max } = space.bounds;
  const corners = [
    { x: min.x, y: min.y + 0.08, z: min.z }, { x: max.x, y: min.y + 0.08, z: min.z },
    { x: max.x, y: min.y + 0.08, z: max.z }, { x: min.x, y: min.y + 0.08, z: max.z },
    { x: min.x, y: max.y - 0.08, z: min.z }, { x: max.x, y: max.y - 0.08, z: min.z },
    { x: max.x, y: max.y - 0.08, z: max.z }, { x: min.x, y: max.y - 0.08, z: max.z },
  ].map((point) => project(point, view));
  const edges = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  context.strokeStyle = "#b9d99f";
  context.lineWidth = 1.4;
  context.setLineDash([5, 4]);
  for (const [from, to] of edges) {
    context.beginPath();
    context.moveTo(corners[from].x, corners[from].y);
    context.lineTo(corners[to].x, corners[to].y);
    context.stroke();
  }
  context.setLineDash([]);
  const labelPoint = project({ x: (min.x + max.x) / 2, y: max.y + 0.12, z: (min.z + max.z) / 2 }, view);
  context.fillStyle = "#d5e8c8";
  context.font = "600 12px ui-monospace, monospace";
  context.textAlign = "center";
  context.fillText(space.id, labelPoint.x, labelPoint.y);
};

const drawLabels = (view) => {
  if (!labelsInput.checked || state.data === null) return;
  const selected = focusSelect.value;
  const spaces = state.data.building.spaces.filter((space) => selected === "all" ? space.kind !== "upper-hall" : space.id === selected);
  context.font = "10px ui-monospace, monospace";
  context.textAlign = "center";
  for (const space of spaces) {
    const point = project({ x: (space.bounds.min.x + space.bounds.max.x) / 2, y: space.bounds.max.y - 0.35, z: (space.bounds.min.z + space.bounds.max.z) / 2 }, view);
    context.fillStyle = selected === space.id ? "#d5e8c8" : "rgba(218, 226, 211, .66)";
    context.fillText(space.id.replace("ground/", "").replace("upper/", "2F "), point.x, point.y);
  }
};

const render = () => {
  state.frame = 0;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  drawBackground(width, height);
  if (state.data === null) return;
  const drawables = partDrawables();
  const bounds = boundsForVisible(drawables);
  const span = Math.max(bounds.max.x - bounds.min.x, bounds.max.z - bounds.min.z, bounds.max.y * 1.35);
  const view = { centerX: width / 2, centerY: height * 0.56, scale: Math.min(width, height) / span * 0.78 * state.zoom };
  drawGround(view);
  const projected = drawables.flatMap((drawable) => {
    const corners = partCorners(drawable.part).map((point) => project(point, view));
    return [{ drawable, depth: corners.reduce((sum, point) => sum + point.depth, 0) / corners.length }];
  }).sort((left, right) => right.depth - left.depth);
  for (const item of projected) drawPart(item.drawable, view);
  const selectedSpace = state.data.building.spaces.find((space) => space.id === focusSelect.value);
  if (selectedSpace !== undefined) drawSpaceBounds(selectedSpace, view);
  drawLabels(view);
};

const scheduleRender = () => {
  if (state.frame !== 0) return;
  state.frame = requestAnimationFrame(render);
};

const updateStats = () => {
  const data = state.data;
  if (data === null) return;
  const q = data.quantities;
  const rows = [
    ["source", data.source.file],
    ["revision", String(data.source.revision)],
    ["spaces", q.roomCount],
    ["openings", q.openingCount],
    ["elements", q.elementCount],
    ["module laws", data.moduleLaws.length],
    ["observations", data.reviewPopulation.length],
    ["topology", data.audits.topology.ok ? "PASS" : "FAIL"],
    ["surface owners", data.audits.surfaces.ok ? "PASS" : "FAIL"],
    ["garage vehicles", data.audits.vehicles.ok ? "NONE" : "FOUND"],
  ];
  stats.innerHTML = rows.map(([key, value]) => `<dt>${key}</dt><dd class="${value === "PASS" || value === "NONE" ? "pass" : ""}">${value}</dd>`).join("");
  legend.innerHTML = Object.entries(MATERIAL_LABELS).map(([material, label]) => `<div class="legend-item"><span class="swatch" style="background:${MATERIAL_COLORS[material]}"></span>${label}</div>`).join("");
};

const updateFocusOptions = () => {
  if (state.data === null) return;
  const current = focusSelect.value;
  focusSelect.innerHTML = `<option value="all">선택 없음</option>${state.data.building.spaces.map((space) => `<option value="${space.id}">${space.id}</option>`).join("")}`;
  focusSelect.value = state.data.building.spaces.some((space) => space.id === current) ? current : "all";
};

const load = async () => {
  status.textContent = "소스를 읽는 중…";
  status.classList.remove("error");
  try {
    const response = await fetch(`/api/house?refresh=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`source request returned ${response.status}`);
    state.data = await response.json();
    updateFocusOptions();
    updateStats();
    fitCamera();
    status.textContent = `${state.data.source.file} · ${new Date(state.data.source.revision).toLocaleString()}`;
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : String(error);
    status.classList.add("error");
  }
};

canvas.addEventListener("pointerdown", (event) => {
  canvas.setPointerCapture(event.pointerId);
  state.dragging = true;
  state.pan = event.shiftKey;
  state.previousPointer = { x: event.clientX, y: event.clientY };
});
canvas.addEventListener("pointermove", (event) => {
  if (!state.dragging) return;
  const dx = event.clientX - state.previousPointer.x;
  const dy = event.clientY - state.previousPointer.y;
  state.previousPointer = { x: event.clientX, y: event.clientY };
  if (event.shiftKey || state.pan) {
    state.target.x -= dx * 0.025 / state.zoom;
    state.target.y += dy * 0.025 / state.zoom;
  } else {
    state.yaw += dx * 0.009;
    state.pitch = clamp(state.pitch + dy * 0.006, 0.16, 1.2);
  }
  scheduleRender();
});
canvas.addEventListener("pointerup", () => { state.dragging = false; });
canvas.addEventListener("pointercancel", () => { state.dragging = false; });
canvas.addEventListener("wheel", (event) => {
  event.preventDefault();
  state.zoom = clamp(state.zoom * Math.exp(-event.deltaY * 0.001), 0.35, 4.5);
  scheduleRender();
}, { passive: false });

for (const control of [storeySelect, sectionSelect, focusSelect, labelsInput]) control.addEventListener("change", () => { fitCamera(); });
resetButton.addEventListener("click", () => {
  state.yaw = -0.78;
  state.pitch = 0.56;
  fitCamera();
});
window.addEventListener("resize", resize);
resize();
load();
