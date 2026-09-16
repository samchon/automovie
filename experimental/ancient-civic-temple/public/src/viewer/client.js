const canvas = document.querySelector("#view");
const context = canvas.getContext("2d");
const status = document.querySelector("#status");
const errorPanel = document.querySelector("#error");
const sectionSelect = document.querySelector("#section");
const spaceSelect = document.querySelector("#space");
const modelSelect = document.querySelector("#model");
const labelsInput = document.querySelector("#labels");
const routesInput = document.querySelector("#routes");
const revision = document.querySelector("#revision");
const stats = document.querySelector("#stats");

let payload = null;
let camera = { yaw: -0.74, pitch: 0.66, zoom: 1, panX: 0, panY: 0 };
let drag = null;

const colorForModel = (environment, modelId) => {
  const model = payload?.models?.find((item) => item.id === modelId) ?? environment.models.find((item) => item.id === modelId);
  return model?.materials[0]?.baseColor?.hex ?? "#aaa08d";
};

const boundsFromSpace = (space) => {
  const result = { min: { x: Infinity, y: Infinity, z: Infinity }, max: { x: -Infinity, y: -Infinity, z: -Infinity } };
  for (const cell of space.cells) {
    for (const plane of cell.planes) {
      if (plane.normal.x === 1) result.max.x = Math.max(result.max.x, plane.offset);
      if (plane.normal.x === -1) result.min.x = Math.min(result.min.x, -plane.offset);
      if (plane.normal.y === 1) result.max.y = Math.max(result.max.y, plane.offset);
      if (plane.normal.y === -1) result.min.y = Math.min(result.min.y, -plane.offset);
      if (plane.normal.z === 1) result.max.z = Math.max(result.max.z, plane.offset);
      if (plane.normal.z === -1) result.min.z = Math.min(result.min.z, -plane.offset);
    }
  }
  return result;
};

const centerOf = (box) => ({
  x: (box.min.x + box.max.x) / 2,
  y: (box.min.y + box.max.y) / 2,
  z: (box.min.z + box.max.z) / 2,
});

const sizeOf = (box) => ({
  x: box.max.x - box.min.x,
  y: box.max.y - box.min.y,
  z: box.max.z - box.min.z,
});

const rotatePoint = (point) => {
  const cosYaw = Math.cos(camera.yaw);
  const sinYaw = Math.sin(camera.yaw);
  const yawX = point.x * cosYaw - point.z * sinYaw;
  const yawZ = point.x * sinYaw + point.z * cosYaw;
  const cosPitch = Math.cos(camera.pitch);
  const sinPitch = Math.sin(camera.pitch);
  return {
    x: yawX,
    y: point.y * cosPitch - yawZ * sinPitch,
    z: point.y * sinPitch + yawZ * cosPitch,
  };
};

const project = (point, width, height) => {
  const rotated = rotatePoint(point);
  const scale = Math.min(width, height) * 0.035 * camera.zoom;
  return {
    x: width / 2 + camera.panX + (rotated.x - rotated.z * 0.52) * scale,
    y: height / 2 + camera.panY - (rotated.y - rotated.z * 0.24) * scale,
    depth: rotated.z,
  };
};

const boxCorners = (element) => {
  const half = { x: element.transform.scale.x / 2, y: element.transform.scale.y / 2, z: element.transform.scale.z / 2 };
  const corners = [];
  for (const y of [-half.y, half.y]) {
    for (const z of [-half.z, half.z]) {
      for (const x of [-half.x, half.x]) {
        corners.push({
          x: element.transform.translation.x + x,
          y: element.transform.translation.y + y,
          z: element.transform.translation.z + z,
        });
      }
    }
  }
  return corners;
};

const cubeFaces = [
  [0, 1, 3, 2],
  [4, 6, 7, 5],
  [0, 4, 5, 1],
  [2, 3, 7, 6],
  [0, 2, 6, 4],
  [1, 5, 7, 3],
];

const shade = (hex, amount) => {
  const value = Number.parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, ((value >> 16) & 255) * amount));
  const g = Math.max(0, Math.min(255, ((value >> 8) & 255) * amount));
  const b = Math.max(0, Math.min(255, (value & 255) * amount));
  return `rgb(${r}, ${g}, ${b})`;
};

const drawBox = (environment, element, width, height, selected) => {
  const corners = boxCorners(element).map((point) => project(point, width, height));
  const faces = cubeFaces.map((face, index) => ({
    points: face.map((corner) => corners[corner]),
    depth: face.reduce((sum, corner) => sum + corners[corner].depth, 0) / face.length,
    shade: [0.74, 1.02, 0.86, 0.62, 0.92, 0.68][index],
  })).sort((left, right) => left.depth - right.depth);
  const base = colorForModel(environment, element.model);
  for (const face of faces) {
    context.beginPath();
    context.moveTo(face.points[0].x, face.points[0].y);
    for (const point of face.points.slice(1)) context.lineTo(point.x, point.y);
    context.closePath();
    context.fillStyle = selected ? shade("#d8a85b", face.shade) : shade(base, face.shade);
    context.fill();
    context.strokeStyle = selected ? "rgba(255, 221, 153, .7)" : "rgba(25, 23, 19, .38)";
    context.lineWidth = selected ? 1.1 : 0.55;
    context.stroke();
  }
};

const modelPartBounds = (part) => {
  const translation = part.transform.translation;
  let size = { x: 0.04, y: 0.04, z: 0.04 };
  const geometry = part.geometry;
  if (geometry.type === "primitive") {
    const shape = geometry.shape;
    if (shape.type === "box") size = { x: shape.width, y: shape.height, z: shape.depth };
    if (shape.type === "cylinder" || shape.type === "cone") size = { x: shape.radius * 2, y: shape.height, z: shape.radius * 2 };
    if (shape.type === "sphere") size = { x: shape.radius * 2, y: shape.radius * 2, z: shape.radius * 2 };
    if (shape.type === "capsule") size = { x: shape.radius * 2, y: shape.height + shape.radius * 2, z: shape.radius * 2 };
    if (shape.type === "plane") size = { x: shape.width, y: 0.02, z: shape.depth };
  } else {
    const positions = geometry.mesh.positions;
    const min = { x: Infinity, y: Infinity, z: Infinity };
    const max = { x: -Infinity, y: -Infinity, z: -Infinity };
    for (let index = 0; index < positions.length; index += 3) {
      min.x = Math.min(min.x, positions[index]);
      min.y = Math.min(min.y, positions[index + 1]);
      min.z = Math.min(min.z, positions[index + 2]);
      max.x = Math.max(max.x, positions[index]);
      max.y = Math.max(max.y, positions[index + 1]);
      max.z = Math.max(max.z, positions[index + 2]);
    }
    size = { x: max.x - min.x, y: max.y - min.y, z: max.z - min.z };
  }
  return {
    min: { x: translation.x - size.x / 2, y: translation.y - size.y / 2, z: translation.z - size.z / 2 },
    max: { x: translation.x + size.x / 2, y: translation.y + size.y / 2, z: translation.z + size.z / 2 },
  };
};

const boundsFromModel = (model) => {
  const result = { min: { x: Infinity, y: Infinity, z: Infinity }, max: { x: -Infinity, y: -Infinity, z: -Infinity } };
  for (const part of model.parts) {
    const bounds = modelPartBounds(part);
    result.min.x = Math.min(result.min.x, bounds.min.x);
    result.min.y = Math.min(result.min.y, bounds.min.y);
    result.min.z = Math.min(result.min.z, bounds.min.z);
    result.max.x = Math.max(result.max.x, bounds.max.x);
    result.max.y = Math.max(result.max.y, bounds.max.y);
    result.max.z = Math.max(result.max.z, bounds.max.z);
  }
  return result;
};

const projectModelPoint = (point, width, height, scale, centre, offset = { x: 0, y: 0 }) => {
  const relative = { x: point.x - centre.x, y: point.y - centre.y, z: point.z - centre.z };
  const rotated = rotatePoint(relative);
  return {
    x: width / 2 + camera.panX + offset.x + (rotated.x - rotated.z * 0.52) * scale,
    y: height / 2 + camera.panY + offset.y - (rotated.y - rotated.z * 0.24) * scale,
    depth: rotated.z,
  };
};

const drawModelPart = (model, part, width, height, scale, centre, selected, offset) => {
  const bounds = modelPartBounds(part);
  const element = {
    model: model.id,
    transform: {
      translation: centerOf(bounds),
      scale: sizeOf(bounds),
    },
  };
  const corners = boxCorners(element).map((point) => projectModelPoint(point, width, height, scale, centre, offset));
  const faces = cubeFaces.map((face, index) => ({
    points: face.map((corner) => corners[corner]),
    depth: face.reduce((sum, corner) => sum + corners[corner].depth, 0) / face.length,
    shade: [0.74, 1.02, 0.86, 0.62, 0.92, 0.68][index],
  })).sort((left, right) => left.depth - right.depth);
  const base = model.materials.find((item) => item.id === part.material)?.baseColor?.hex ?? "#aaa08d";
  for (const face of faces) {
    context.beginPath();
    context.moveTo(face.points[0].x, face.points[0].y);
    for (const point of face.points.slice(1)) context.lineTo(point.x, point.y);
    context.closePath();
    context.fillStyle = selected ? shade("#d8a85b", face.shade) : shade(base, face.shade);
    context.fill();
    context.strokeStyle = selected ? "rgba(255, 221, 153, .9)" : "rgba(25, 23, 19, .48)";
    context.lineWidth = selected ? 1.2 : 0.65;
    context.stroke();
  }
};

const drawModelBoard = (width, height, selectedId) => {
  const models = (payload.models ?? []).filter((item) => selectedId === "all" || item.id === selectedId);
  if (models.length === 0) return;
  const modelBounds = models.map((model) => ({ model, bounds: boundsFromModel(model) }));
  if (selectedId !== "all") {
    const entry = modelBounds[0];
    const centre = centerOf(entry.bounds);
    const extent = Math.max(sizeOf(entry.bounds).x, sizeOf(entry.bounds).y, sizeOf(entry.bounds).z, 1);
    const scale = Math.min(width, height) * 0.22 * camera.zoom / extent;
    for (const part of entry.model.parts) drawModelPart(entry.model, part, width, height, scale, centre, true, { x: 0, y: 0 });
    if (labelsInput.checked) {
      const point = projectModelPoint(centre, width, height, scale, centre);
      drawLabel(entry.model.id.replace("model/", ""), point, true);
    }
    return;
  }
  const columns = Math.min(4, modelBounds.length);
  const rows = Math.ceil(modelBounds.length / columns);
  const cellWidth = width / columns;
  const cellHeight = height / rows;
  for (const [index, entry] of modelBounds.entries()) {
    const centre = centerOf(entry.bounds);
    const extent = Math.max(sizeOf(entry.bounds).x, sizeOf(entry.bounds).y, sizeOf(entry.bounds).z, 1);
    const scale = Math.min(cellWidth, cellHeight) * 0.46 * camera.zoom / extent;
    const offset = {
      x: (index % columns + 0.5) * cellWidth - width / 2,
      y: (Math.floor(index / columns) + 0.5) * cellHeight - height / 2,
    };
    for (const part of entry.model.parts) drawModelPart(entry.model, part, width, height, scale, centre, false, offset);
    if (labelsInput.checked) {
      const point = projectModelPoint(centre, width, height, scale, centre, offset);
      drawLabel(entry.model.id.replace("model/", ""), point, false);
    }
  }
};

const drawRoute = (route, width, height, selected) => {
  const points = route.map((point) => project(point, width, height));
  if (points.length < 2) return;
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);
  for (const point of points.slice(1)) context.lineTo(point.x, point.y);
  context.strokeStyle = selected ? "#ffcf72" : "rgba(216, 168, 91, .6)";
  context.lineWidth = selected ? 2.3 : 1.1;
  context.setLineDash(selected ? [] : [5, 4]);
  context.stroke();
  context.setLineDash([]);
};

const drawObservationRoutes = (environment, width, height, selectedId) => {
  const anchorsByRoom = new Map();
  for (const element of environment.elements) {
    if (element.kind !== "observation-route-anchor") continue;
    const [room, name] = element.id.split("/").slice(-2);
    if (!anchorsByRoom.has(room)) anchorsByRoom.set(room, new Map());
    anchorsByRoom.get(room).set(name, element.transform.translation);
  }
  for (const [room, anchors] of anchorsByRoom) {
    const center = anchors.get("center");
    const threshold = anchors.get("threshold");
    if (center === undefined || threshold === undefined) continue;
    const selected = room === selectedId;
    drawRoute([threshold, center], width, height, selected);
    for (const name of ["north", "east", "south", "west"]) {
      const point = anchors.get(name);
      if (point !== undefined) drawRoute([center, point], width, height, selected);
    }
  }
};

const drawLoopReturn = (environment, width, height, selectedId) => {
  const points = environment.elements
    .filter((element) => element.kind === "loop-return-anchor")
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((element) => element.transform.translation);
  drawRoute(points, width, height, selectedId === "colonnade-loop");
};

const drawSpaceOutline = (space, width, height, selected) => {
  for (const cell of space.cells) {
    const bounds = boundsFromSpace({ cells: [cell] });
    const points = [
      { x: bounds.min.x, y: 0.03, z: bounds.min.z },
      { x: bounds.max.x, y: 0.03, z: bounds.min.z },
      { x: bounds.max.x, y: 0.03, z: bounds.max.z },
      { x: bounds.min.x, y: 0.03, z: bounds.max.z },
    ].map((point) => project(point, width, height));
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    for (const point of points.slice(1)) context.lineTo(point.x, point.y);
    context.closePath();
    context.strokeStyle = selected ? "rgba(255, 207, 114, .9)" : "rgba(208, 198, 177, .15)";
    context.lineWidth = selected ? 1.5 : 0.5;
    context.setLineDash(selected ? [7, 4] : []);
    context.stroke();
    context.setLineDash([]);
  }
};

const drawLabel = (text, point, selected) => {
  context.font = selected ? "12px ui-sans-serif" : "10px ui-sans-serif";
  context.fillStyle = selected ? "#ffe0a2" : "rgba(238, 231, 216, .66)";
  context.fillText(text, point.x + 5, point.y - 4);
};

const resizeCanvas = () => {
  const rect = canvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * scale));
  canvas.height = Math.max(1, Math.floor(rect.height * scale));
  context.setTransform(scale, 0, 0, scale, 0, 0);
  render(rect.width, rect.height);
};

const render = (width, height) => {
  context.clearRect(0, 0, width, height);
  if (payload === null) return;
  const { environment } = payload;
  const section = sectionSelect.value;
  if (section === "model-board") {
    drawModelBoard(width, height, modelSelect.value);
    return;
  }
  const selectedId = spaceSelect.value;
  const selectedSpace = environment.spaces.find((item) => item.id === selectedId);
  const selectedElementIds = new Set(selectedSpace === undefined ? [] : environment.elements.filter((item) => item.space === selectedSpace.id).map((item) => item.id));
  const elements = environment.elements.filter((item) => item.model !== null && item.kind !== "observation-route-reservation" && (section !== "roof-open" || item.kind !== "roof-cover") && (section !== "cutaway" || !["roof-cover", "exterior-wall"].includes(item.kind) || item.id.includes("south") || item.id.includes("west")));
  const ordered = [...elements].sort((left, right) => rotatePoint(left.transform.translation).z - rotatePoint(right.transform.translation).z);
  for (const element of ordered) drawBox(environment, element, width, height, selectedElementIds.has(element.id));
  if (routesInput.checked) {
    for (const connector of environment.connectors) drawRoute(connector.route, width, height, connector.from === selectedId || connector.to === selectedId);
    drawLoopReturn(environment, width, height, selectedId);
    drawObservationRoutes(environment, width, height, selectedId);
  }
  for (const space of environment.spaces) {
    const selected = space.id === selectedId;
    drawSpaceOutline(space, width, height, selected);
    if (labelsInput.checked && space.id !== "site" && space.id !== "ground-storey") {
      const point = project(centerOf(boundsFromSpace(space)), width, height);
      drawLabel(space.id, point, selected);
    }
  }
};

const setStatus = (state, text) => {
  status.dataset.state = state;
  status.textContent = text;
};

const updateStats = () => {
  if (payload === null) {
    stats.innerHTML = "";
    return;
  }
  const { environment } = payload;
  const models = payload.models ?? [];
  const selectedModel = models.find((item) => item.id === modelSelect.value);
  stats.innerHTML = `<dt>spaces</dt><dd>${environment.spaces.length}</dd><dt>elements</dt><dd>${environment.elements.length}</dd><dt>openings</dt><dd>${environment.openings.length}</dd><dt>connectors</dt><dd>${environment.connectors.length}</dd><dt>surfaces</dt><dd>${environment.surfaces.length}</dd><dt>models</dt><dd>${models.length}</dd><dt>model parts</dt><dd>${selectedModel?.parts.length ?? "all"}</dd>`;
};

const loadSource = async () => {
  setStatus("loading", "Loading current source…");
  errorPanel.hidden = true;
  try {
    const response = await fetch(`/api/temple?request=${Date.now()}`, { cache: "no-store" });
    const nextPayload = await response.json();
    if (!response.ok) throw new Error(nextPayload.error ?? `HTTP ${response.status}`);
    payload = nextPayload;
    const models = payload.models ?? [];
    const previous = spaceSelect.value;
    const previousModel = modelSelect.value;
    spaceSelect.replaceChildren(new Option("All spaces", "all"));
    for (const space of payload.environment.spaces) spaceSelect.append(new Option(`${space.id} · ${space.kind}`, space.id));
    spaceSelect.value = payload.environment.spaces.some((item) => item.id === previous) ? previous : "all";
    modelSelect.replaceChildren(new Option("All model prototypes", "all"));
    for (const model of models) modelSelect.append(new Option(`${model.id} / ${model.name}`, model.id));
    modelSelect.value = models.some((item) => item.id === previousModel) ? previousModel : "all";
    setStatus("ready", "Live source loaded");
    revision.textContent = `Source revision: ${payload.source} · mtime ${new Date(payload.revision).toISOString()} · refresh after save`;
    updateStats();
    resizeCanvas();
  } catch (error) {
    payload = null;
    setStatus("error", "Source unavailable");
    errorPanel.textContent = `The current source did not load, so no stale view is shown: ${error instanceof Error ? error.message : String(error)}`;
    errorPanel.hidden = false;
    updateStats();
    resizeCanvas();
  }
};

const resetView = () => {
  camera = { yaw: -0.74, pitch: 0.66, zoom: 1, panX: 0, panY: 0 };
  render(canvas.clientWidth, canvas.clientHeight);
};

canvas.addEventListener("pointerdown", (event) => {
  drag = { x: event.clientX, y: event.clientY, pan: event.shiftKey || event.button === 2 };
  canvas.classList.add("dragging");
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove", (event) => {
  if (drag === null) return;
  const dx = event.clientX - drag.x;
  const dy = event.clientY - drag.y;
  if (drag.pan) {
    camera.panX += dx;
    camera.panY += dy;
  } else {
    camera.yaw += dx * 0.008;
    camera.pitch = Math.max(-1.2, Math.min(1.2, camera.pitch + dy * 0.008));
  }
  drag.x = event.clientX;
  drag.y = event.clientY;
  render(canvas.clientWidth, canvas.clientHeight);
});
canvas.addEventListener("pointerup", () => { drag = null; canvas.classList.remove("dragging"); });
canvas.addEventListener("pointercancel", () => { drag = null; canvas.classList.remove("dragging"); });
canvas.addEventListener("contextmenu", (event) => event.preventDefault());
canvas.addEventListener("wheel", (event) => {
  event.preventDefault();
  camera.zoom = Math.max(0.35, Math.min(3.4, camera.zoom * Math.exp(-event.deltaY * 0.001)));
  render(canvas.clientWidth, canvas.clientHeight);
}, { passive: false });
sectionSelect.addEventListener("change", () => render(canvas.clientWidth, canvas.clientHeight));
spaceSelect.addEventListener("change", () => render(canvas.clientWidth, canvas.clientHeight));
modelSelect.addEventListener("change", () => render(canvas.clientWidth, canvas.clientHeight));
labelsInput.addEventListener("change", () => render(canvas.clientWidth, canvas.clientHeight));
routesInput.addEventListener("change", () => render(canvas.clientWidth, canvas.clientHeight));
document.querySelector("#reset").addEventListener("click", resetView);
document.querySelector("#reload").addEventListener("click", loadSource);
window.addEventListener("resize", resizeCanvas);

loadSource();
