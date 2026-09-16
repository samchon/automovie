import type {
  IAutoMovieBuiltElement,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltSpace,
  IAutoMovieColor,
  IAutoMovieLibraryBuildContext,
  IAutoMovieModel,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { citizenHouseSpaceSource } from "../spaces/citizen-house";

type Point = IAutoMovieVector3;
type ViewMode = "whole" | "ground" | "upper" | "roof";
type DragMode = "orbit" | "pan";

interface CameraState {
  yaw: number;
  pitch: number;
  zoom: number;
  panX: number;
  panY: number;
}

interface ProjectedPoint {
  x: number;
  y: number;
  depth: number;
}

interface DrawBox {
  id: string;
  kind: string;
  space: string | null;
  corners: Point[];
  color: IAutoMovieColor;
  opacity: number;
  selected: boolean;
  depth: number;
}

const BUILD_CONTEXT: IAutoMovieLibraryBuildContext = {
  production: "future-citizen-house",
  branch: "spaces",
  design: "docs/spaces/001-citizen-house.md",
  anchor: "citizen-house-space",
  derivedArtifacts: {},
};

const canvas = required<HTMLCanvasElement>("#scene");
const viewModeSelect = required<HTMLSelectElement>("#view-mode");
const spaceSelect = required<HTMLSelectElement>("#space-select");
const interiorOnly = required<HTMLInputElement>("#interior-only");
const resetCameraButton = required<HTMLButtonElement>("#reset-camera");
const refreshSourceButton = required<HTMLButtonElement>("#refresh-source");
const environmentTitle = required<HTMLElement>("#environment-title");
const topologyStats = required<HTMLElement>("#topology-stats");
const spaceTitle = required<HTMLElement>("#space-title");
const spaceStats = required<HTMLElement>("#space-stats");
const buildStatus = required<HTMLElement>("#build-status");
const context: CanvasRenderingContext2D = getCanvasContext();

const camera: CameraState = {
  yaw: -0.72,
  pitch: 0.54,
  zoom: 45,
  panX: 0,
  panY: 30,
};

let environment = buildEnvironment();
let selectedSpace = "all";
let viewMode: ViewMode = "whole";
let dragging: { mode: DragMode; x: number; y: number } | null = null;

function required<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (element === null) throw new Error(`viewer element ${selector} is missing`);
  return element;
}

function getCanvasContext(): CanvasRenderingContext2D {
  const value = canvas.getContext("2d");
  if (value === null) throw new Error("2D canvas context is unavailable");
  return value;
}

function buildEnvironment(): IAutoMovieBuiltEnvironment {
  const contribution = citizenHouseSpaceSource.build(BUILD_CONTEXT);
  const built = contribution.environments[0];
  if (built === undefined) throw new Error("citizen-house source returned no environment");
  return built;
}

function resetCamera(): void {
  camera.yaw = -0.72;
  camera.pitch = 0.54;
  camera.zoom = 45;
  camera.panX = 0;
  camera.panY = 30;
  render();
}

function populateSpaceSelect(): void {
  spaceSelect.replaceChildren();
  appendOption(spaceSelect, "all", "전체 공간");
  for (const space of environment.spaces) appendOption(spaceSelect, space.id, `${space.id} · ${space.kind}`);
  if (environment.spaces.some((space) => space.id === selectedSpace)) spaceSelect.value = selectedSpace;
  else {
    selectedSpace = "all";
    spaceSelect.value = "all";
  }
}

function appendOption(select: HTMLSelectElement, value: string, label: string): void {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  select.append(option);
}

function render(): void {
  resizeCanvas();
  const bounds = visibleWorldBounds();
  context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  drawBackdrop();
  drawGroundGuide(bounds);
  drawSelectedSpace(bounds);

  const boxes = [...elementBoxes(), ...populationBoxes()]
    .filter((box) => isVisible(box))
    .map((box) => projectBox(box))
    .sort((left, right) => left.depth - right.depth);
  for (const box of boxes) drawBox(box);
  drawSelectedLabel();
  updateInspector();
}

function resizeCanvas(): void {
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.floor(canvas.clientWidth * ratio));
  const height = Math.max(1, Math.floor(canvas.clientHeight * ratio));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function drawBackdrop(): void {
  const gradient = context.createLinearGradient(0, 0, 0, canvas.clientHeight);
  gradient.addColorStop(0, "#1b343a");
  gradient.addColorStop(0.55, "#122226");
  gradient.addColorStop(1, "#0a1317");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
}

function visibleWorldBounds(): { min: Point; max: Point } {
  if (viewMode === "ground") return { min: point(-8, -0.4, -8), max: point(8, 3.1, 8) };
  if (viewMode === "upper") return { min: point(-6, 2.7, -7), max: point(6, 6.3, 7) };
  if (viewMode === "roof") return { min: point(-7, 5.8, -7), max: point(7, 7.1, 7) };
  return { min: point(-9, -0.5, -9), max: point(9, 7.2, 9) };
}

function drawGroundGuide(bounds: { min: Point; max: Point }): void {
  if (viewMode === "upper" || viewMode === "roof") return;
  context.save();
  context.lineWidth = 1;
  for (let x = Math.ceil(bounds.min.x); x <= bounds.max.x; x += 1) drawGuideLine(point(x, -0.38, bounds.min.z), point(x, -0.38, bounds.max.z));
  for (let z = Math.ceil(bounds.min.z); z <= bounds.max.z; z += 1) drawGuideLine(point(bounds.min.x, -0.38, z), point(bounds.max.x, -0.38, z));
  context.restore();
}

function drawGuideLine(start: Point, end: Point): void {
  const first = project(start);
  const second = project(end);
  context.strokeStyle = "rgba(150, 204, 196, 0.11)";
  context.beginPath();
  context.moveTo(first.x, first.y);
  context.lineTo(second.x, second.y);
  context.stroke();
}

function drawSelectedSpace(bounds: { min: Point; max: Point }): void {
  if (selectedSpace === "all") return;
  const space = environment.spaces.find((entry) => entry.id === selectedSpace);
  if (space === undefined) return;
  const spaceBounds = spaceBoundsOf(space);
  if (spaceBounds === null) return;
  const floorY = Math.max(spaceBounds.min.y + 0.025, bounds.min.y + 0.025);
  const floor = [
    point(spaceBounds.min.x, floorY, spaceBounds.min.z),
    point(spaceBounds.max.x, floorY, spaceBounds.min.z),
    point(spaceBounds.max.x, floorY, spaceBounds.max.z),
    point(spaceBounds.min.x, floorY, spaceBounds.max.z),
  ].map(project);
  context.save();
  context.fillStyle = "rgba(111, 226, 199, 0.13)";
  fillPolygon(floor);
  context.strokeStyle = "rgba(142, 217, 199, 0.92)";
  context.lineWidth = 2;
  for (const edge of spaceEdges(spaceBounds)) {
    const projected = edge.map(project);
    strokePolygon(projected, true);
  }
  context.restore();
}

function drawSelectedLabel(): void {
  if (selectedSpace === "all") return;
  const space = environment.spaces.find((entry) => entry.id === selectedSpace);
  if (space === undefined) return;
  const bounds = spaceBoundsOf(space);
  if (bounds === null) return;
  const labelPoint = project(point((bounds.min.x + bounds.max.x) / 2, bounds.max.y + 0.18, (bounds.min.z + bounds.max.z) / 2));
  const label = `${space.id} · ${space.kind}`;
  context.save();
  context.font = "600 12px Segoe UI, sans-serif";
  const width = context.measureText(label).width + 16;
  context.fillStyle = "rgba(7, 16, 19, 0.86)";
  context.fillRect(labelPoint.x - width / 2, labelPoint.y - 17, width, 23);
  context.fillStyle = "#bff9e9";
  context.textAlign = "center";
  context.fillText(label, labelPoint.x, labelPoint.y - 2);
  context.restore();
}

function elementBoxes(): DrawBox[] {
  const models = new Map(environment.models.map((model) => [model.id, model] as const));
  const elements = environment.elements.filter((element) => element.model !== null);
  return elements.flatMap((element) => {
    const model = models.get(element.model!);
    if (model === undefined) return [];
    const corners = unitBoxCorners(modelDimensions(model)).map((corner) => worldPointOfElement(element, corner));
    const material = firstMaterial(model);
    return [{
      id: element.id,
      kind: element.kind,
      space: element.space,
      corners,
      color: material.color,
      opacity: material.opacity,
      selected: element.space === selectedSpace,
      depth: 0,
    }];
  });
}

function populationBoxes(): DrawBox[] {
  const models = new Map(environment.models.map((model) => [model.id, model] as const));
  return (environment.populations ?? []).flatMap((population) => {
    const model = models.get(population.set.modelRecipe);
    if (model === undefined || population.set.layout.kind !== "explicit") return [];
    const material = firstMaterial(model);
    return population.set.layout.transforms.filter((entry) => entry.visible !== false).map((entry) => {
      const corners = unitBoxCorners(modelDimensions(model), population.prototypeBounds).map((corner) => populationPoint(population.set.anchor, population.set.facingDeg, entry, corner));
      return {
        id: `${population.set.id}/${entry.id}`,
        kind: "population",
        space: population.space,
        corners,
        color: material.color,
        opacity: material.opacity,
        selected: population.space === selectedSpace,
        depth: 0,
      };
    });
  });
}

function isVisible(box: DrawBox): boolean {
  if (interiorOnly.checked && isEnvelope(box)) return false;
  const center = averagePoint(box.corners);
  if (viewMode === "ground") return center.y < 3.08;
  if (viewMode === "upper") return center.y >= 2.72 && center.y < 6.08;
  if (viewMode === "roof") return center.y >= 5.82;
  return true;
}

function isEnvelope(box: DrawBox): boolean {
  return box.kind.includes("wall") || box.kind.includes("partition") || box.kind.includes("slab") || box.kind.includes("roof") || box.kind.includes("door") || box.id.includes("curtainwall") || box.id.includes("shading") || box.id === "foundation-slab";
}

function projectBox(box: DrawBox): DrawBox {
  return { ...box, depth: box.corners.reduce((sum, corner) => sum + project(corner).depth, 0) / box.corners.length };
}

function drawBox(box: DrawBox): void {
  const projected = box.corners.map(project);
  const faces: Array<{ indices: number[]; shade: number }> = [
    { indices: [0, 1, 2, 3], shade: 0.74 },
    { indices: [4, 7, 6, 5], shade: 1.12 },
    { indices: [0, 4, 5, 1], shade: 0.86 },
    { indices: [1, 5, 6, 2], shade: 0.96 },
    { indices: [2, 6, 7, 3], shade: 0.68 },
    { indices: [3, 7, 4, 0], shade: 0.8 },
  ];
  context.save();
  for (const face of faces) {
    const polygon = face.indices.map((index) => projected[index]!);
    context.fillStyle = cssColor(box.color, face.shade, box.opacity);
    context.strokeStyle = box.selected ? "rgba(191, 249, 233, 0.9)" : "rgba(7, 14, 17, 0.34)";
    context.lineWidth = box.selected ? 1.25 : 0.55;
    fillPolygon(polygon);
    context.stroke();
  }
  context.restore();
}

function fillPolygon(points: ProjectedPoint[]): void {
  if (points.length === 0) return;
  context.beginPath();
  context.moveTo(points[0]!.x, points[0]!.y);
  for (const point of points.slice(1)) context.lineTo(point.x, point.y);
  context.closePath();
  context.fill();
  context.stroke();
}

function strokePolygon(points: ProjectedPoint[], close: boolean): void {
  if (points.length === 0) return;
  context.beginPath();
  context.moveTo(points[0]!.x, points[0]!.y);
  for (const point of points.slice(1)) context.lineTo(point.x, point.y);
  if (close) context.closePath();
  context.stroke();
}

function updateInspector(): void {
  const selected = environment.spaces.find((space) => space.id === selectedSpace);
  environmentTitle.textContent = environment.id;
  replaceDefinitionList(topologyStats, [
    ["spaces", String(environment.spaces.length)],
    ["elements", String(environment.elements.length)],
    ["populations", String(environment.populations?.length ?? 0)],
    ["population members", String((environment.populations ?? []).reduce((sum, population) => sum + population.set.count, 0))],
    ["openings", String(environment.openings.length)],
    ["connectors", String(environment.connectors.length)],
    ["surfaces", String(environment.surfaces.length)],
  ]);
  if (selected === undefined) {
    spaceTitle.textContent = "전체 공간";
    replaceDefinitionList(spaceStats, [["selection", "all"]]);
    return;
  }
  const contentElements = environment.elements.filter((element) => element.space === selected.id).length;
  const contentPopulations = (environment.populations ?? []).filter((population) => population.space === selected.id);
  const bounds = spaceBoundsOf(selected);
  spaceTitle.textContent = `${selected.id} · ${selected.kind}`;
  replaceDefinitionList(spaceStats, [
    ["parent", selected.parent ?? "root"],
    ["direct elements", String(contentElements)],
    ["direct populations", `${contentPopulations.length} / ${contentPopulations.reduce((sum, population) => sum + population.set.count, 0)} members`],
    ["space extent", bounds === null ? "semantic only" : extentText(bounds)],
  ]);
}

function replaceDefinitionList(list: HTMLElement, entries: Array<[string, string]>): void {
  list.replaceChildren();
  for (const [term, description] of entries) {
    const dt = document.createElement("dt");
    dt.textContent = term;
    const dd = document.createElement("dd");
    dd.textContent = description;
    list.append(dt, dd);
  }
}

function spaceBoundsOf(space: IAutoMovieBuiltSpace): { min: Point; max: Point } | null {
  const cell = space.cells[0];
  if (cell === undefined) return null;
  const min = point(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
  const max = point(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
  for (const plane of cell.planes) {
    if (plane.normal.x > 0) max.x = Math.min(max.x, plane.offset / plane.normal.x);
    if (plane.normal.x < 0) min.x = Math.max(min.x, plane.offset / plane.normal.x);
    if (plane.normal.y > 0) max.y = Math.min(max.y, plane.offset / plane.normal.y);
    if (plane.normal.y < 0) min.y = Math.max(min.y, plane.offset / plane.normal.y);
    if (plane.normal.z > 0) max.z = Math.min(max.z, plane.offset / plane.normal.z);
    if (plane.normal.z < 0) min.z = Math.max(min.z, plane.offset / plane.normal.z);
  }
  if (![min.x, min.y, min.z, max.x, max.y, max.z].every(Number.isFinite)) return null;
  return { min, max };
}

function spaceEdges(bounds: { min: Point; max: Point }): Array<[Point, Point]> {
  const corners = unitBoxCorners({ x: bounds.max.x - bounds.min.x, y: bounds.max.y - bounds.min.y, z: bounds.max.z - bounds.min.z }).map((corner) => point(corner.x + bounds.min.x + (bounds.max.x - bounds.min.x) / 2, corner.y + bounds.min.y + (bounds.max.y - bounds.min.y) / 2, corner.z + bounds.min.z + (bounds.max.z - bounds.min.z) / 2));
  return [
    [corners[0]!, corners[1]!], [corners[1]!, corners[2]!], [corners[2]!, corners[3]!], [corners[3]!, corners[0]!],
    [corners[4]!, corners[5]!], [corners[5]!, corners[6]!], [corners[6]!, corners[7]!], [corners[7]!, corners[4]!],
    [corners[0]!, corners[4]!], [corners[1]!, corners[5]!], [corners[2]!, corners[6]!], [corners[3]!, corners[7]!],
  ];
}

function worldPointOfElement(element: IAutoMovieBuiltElement, local: Point): Point {
  const chain: IAutoMovieTransform[] = [];
  let current: IAutoMovieBuiltElement | undefined = element;
  const elements = new Map(environment.elements.map((entry) => [entry.id, entry] as const));
  while (current !== undefined) {
    chain.unshift(current.transform);
    current = current.parent === null ? undefined : elements.get(current.parent);
  }
  return chain.reduce((value, transform) => applyTransform(transform, value), local);
}

function populationPoint(anchor: Point, facingDeg: number, transform: IAutoMovieTransform, local: Point): Point {
  const placed = applyTransform(transform, local);
  const heading = (facingDeg * Math.PI) / 180;
  const rotated = rotateY(placed, heading);
  return point(rotated.x + anchor.x, rotated.y + anchor.y, rotated.z + anchor.z);
}

function applyTransform(transform: IAutoMovieTransform, local: Point): Point {
  const scaled = point(local.x * transform.scale.x, local.y * transform.scale.y, local.z * transform.scale.z);
  const rotated = rotateQuaternion(scaled, transform.rotation);
  return point(rotated.x + transform.translation.x, rotated.y + transform.translation.y, rotated.z + transform.translation.z);
}

function rotateQuaternion(value: Point, quaternion: IAutoMovieQuaternion): Point {
  const qx = quaternion.x;
  const qy = quaternion.y;
  const qz = quaternion.z;
  const qw = quaternion.w;
  const ix = qw * value.x + qy * value.z - qz * value.y;
  const iy = qw * value.y + qz * value.x - qx * value.z;
  const iz = qw * value.z + qx * value.y - qy * value.x;
  const iw = -qx * value.x - qy * value.y - qz * value.z;
  return point(ix * qw + iw * -qx + iy * -qz - iz * -qy, iy * qw + iw * -qy + iz * -qx - ix * -qz, iz * qw + iw * -qz + ix * -qy - iy * -qx);
}

function rotateY(value: Point, angle: number): Point {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return point(value.x * cosine - value.z * sine, value.y, value.x * sine + value.z * cosine);
}

function project(value: Point): ProjectedPoint {
  const focus = point(0, 2.8, 0);
  const translated = point(value.x - focus.x, value.y - focus.y, value.z - focus.z);
  const yawCosine = Math.cos(camera.yaw);
  const yawSine = Math.sin(camera.yaw);
  const yawX = translated.x * yawCosine - translated.z * yawSine;
  const yawZ = translated.x * yawSine + translated.z * yawCosine;
  const pitchCosine = Math.cos(camera.pitch);
  const pitchSine = Math.sin(camera.pitch);
  const pitchY = translated.y * pitchCosine - yawZ * pitchSine;
  const depth = translated.y * pitchSine + yawZ * pitchCosine;
  return {
    x: canvas.clientWidth / 2 + camera.panX + yawX * camera.zoom,
    y: canvas.clientHeight / 2 + camera.panY - pitchY * camera.zoom,
    depth,
  };
}

function modelDimensions(model: IAutoMovieModel): Point {
  const primitive = model.parts.find((part) => part.geometry.type === "primitive");
  if (primitive?.geometry.type !== "primitive" || primitive.geometry.shape.type !== "box") return point(1, 1, 1);
  return point(primitive.geometry.shape.width, primitive.geometry.shape.height, primitive.geometry.shape.depth);
}

function unitBoxCorners(dimensions: Point, bounds?: { min: Point; max: Point }): Point[] {
  const min = bounds?.min ?? point(-dimensions.x / 2, -dimensions.y / 2, -dimensions.z / 2);
  const max = bounds?.max ?? point(dimensions.x / 2, dimensions.y / 2, dimensions.z / 2);
  return [
    point(min.x, min.y, min.z), point(max.x, min.y, min.z), point(max.x, min.y, max.z), point(min.x, min.y, max.z),
    point(min.x, max.y, min.z), point(max.x, max.y, min.z), point(max.x, max.y, max.z), point(min.x, max.y, max.z),
  ];
}

function firstMaterial(model: IAutoMovieModel): { color: IAutoMovieColor; opacity: number } {
  const material = model.materials[0];
  if (material === undefined) return { color: { r: 0.5, g: 0.5, b: 0.5, a: 1, hex: null }, opacity: 1 };
  return { color: material.baseColor, opacity: material.transmission === undefined ? material.opacity : Math.min(material.opacity, 0.64) };
}

function cssColor(color: IAutoMovieColor, shade: number, opacity: number): string {
  const red = Math.round(Math.max(0, Math.min(1, color.r * shade)) * 255);
  const green = Math.round(Math.max(0, Math.min(1, color.g * shade)) * 255);
  const blue = Math.round(Math.max(0, Math.min(1, color.b * shade)) * 255);
  return `rgba(${red}, ${green}, ${blue}, ${Math.max(0.08, Math.min(1, opacity * (color.a ?? 1)))})`;
}

function averagePoint(points: Point[]): Point {
  const total = points.reduce((sum, entry) => point(sum.x + entry.x, sum.y + entry.y, sum.z + entry.z), point(0, 0, 0));
  return point(total.x / points.length, total.y / points.length, total.z / points.length);
}

function point(x: number, y: number, z: number): Point {
  return { x, y, z };
}

function extentText(bounds: { min: Point; max: Point }): string {
  return `${(bounds.max.x - bounds.min.x).toFixed(2)} × ${(bounds.max.y - bounds.min.y).toFixed(2)} × ${(bounds.max.z - bounds.min.z).toFixed(2)} m`;
}

spaceSelect.addEventListener("change", () => {
  selectedSpace = spaceSelect.value;
  render();
});

viewModeSelect.addEventListener("change", () => {
  viewMode = viewModeSelect.value as ViewMode;
  render();
});

interiorOnly.addEventListener("change", render);
resetCameraButton.addEventListener("click", resetCamera);
refreshSourceButton.addEventListener("click", () => {
  environment = buildEnvironment();
  populateSpaceSelect();
  buildStatus.textContent = `rebuilt ${new Date().toLocaleTimeString()}`;
  render();
});

canvas.addEventListener("contextmenu", (event) => event.preventDefault());
canvas.addEventListener("pointerdown", (event) => {
  dragging = { mode: event.button === 2 || event.shiftKey ? "pan" : "orbit", x: event.clientX, y: event.clientY };
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove", (event) => {
  if (dragging === null) return;
  const dx = event.clientX - dragging.x;
  const dy = event.clientY - dragging.y;
  if (dragging.mode === "pan") {
    camera.panX += dx;
    camera.panY += dy;
  } else {
    camera.yaw += dx * 0.009;
    camera.pitch = Math.max(0.15, Math.min(1.25, camera.pitch + dy * 0.009));
  }
  dragging.x = event.clientX;
  dragging.y = event.clientY;
  render();
});
canvas.addEventListener("pointerup", (event) => {
  dragging = null;
  canvas.releasePointerCapture(event.pointerId);
});
canvas.addEventListener("pointercancel", () => { dragging = null; });
canvas.addEventListener("wheel", (event) => {
  event.preventDefault();
  camera.zoom = Math.max(8, Math.min(110, camera.zoom * Math.exp(-event.deltaY * 0.001)));
  render();
}, { passive: false });

populateSpaceSelect();
buildStatus.textContent = "built from current source";
const resizeObserver = new ResizeObserver(render);
resizeObserver.observe(canvas);
render();
