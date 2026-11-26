import type { NodeCanvasTypes } from "./NodeCanvasTypes";

/**
 * Orthographic display cameras in the existing +X forward, +Y up, +Z left frame.
 * Fits only supplied source points. It makes no Three/OrbitControls equivalence claim.
 * Top puts +X downward and +Z leftward; exact poles need no orbit guard here.
 */
export namespace NodeCanvasCamera {
  /** Unit directions selected for the experimental seven-camera sweep. */
  const DIRECTIONS: Readonly<Record<string, NodeCanvasTypes.Point>> = {
    front: [1, 0, 0], left: [0, 0, 1], back: [-1, 0, 0],
    right: [0, 0, -1], top: [0, 1, 0], "high-oblique": [1, 0.7, 1],
    "low-oblique": [1, -0.5, -1],
  };

  /** Camera names in deterministic capture order. */
  export function names(): string[] { return Object.keys(DIRECTIONS); }

  /** Fits a source ROI with 12 percent screen margin; output dimensions are display choices. */
  export function fit(name: string, points: readonly NodeCanvasTypes.Point[], width: number = 720, height: number = 900): NodeCanvasTypes.Camera {
    if (points.length === 0) throw new Error("Cannot frame an empty source selection");
    const direction: NodeCanvasTypes.Point | undefined = DIRECTIONS[name];
    if (direction === undefined) throw new Error("Unknown Node camera " + name);
    const back: NodeCanvasTypes.Point = unit(direction);
    const right: NodeCanvasTypes.Point = unit(cross(name === "top" ? [-1, 0, 0] : [0, 1, 0], back));
    const up: NodeCanvasTypes.Point = cross(back, right);
    const low: NodeCanvasTypes.Point = [Infinity, Infinity, Infinity];
    const high: NodeCanvasTypes.Point = [-Infinity, -Infinity, -Infinity];
    for (const point of points) for (let c: number = 0; c < 3; c++) {
      low[c] = Math.min(low[c]!, point[c]!);
      high[c] = Math.max(high[c]!, point[c]!);
    }
    const target: NodeCanvasTypes.Point = [(low[0] + high[0]) / 2, (low[1] + high[1]) / 2, (low[2] + high[2]) / 2];
    let extentX: number = 0;
    let extentY: number = 0;
    for (const point of points) {
      const delta: NodeCanvasTypes.Point = [point[0] - target[0], point[1] - target[1], point[2] - target[2]];
      extentX = Math.max(extentX, Math.abs(dot(delta, right)));
      extentY = Math.max(extentY, Math.abs(dot(delta, up)));
    }
    const scale: number = 0.88 * Math.min((width - 40) / Math.max(2 * extentX, 0.001), (height - 110) / Math.max(2 * extentY, 0.001));
    return { name, target, back, right, up, scale, width, height };
  }

  /** Projects a metre point; larger z is nearer and screen y increases downward. */
  export function project(point: NodeCanvasTypes.Point, camera: NodeCanvasTypes.Camera): NodeCanvasTypes.Point {
    const delta: NodeCanvasTypes.Point = [point[0] - camera.target[0], point[1] - camera.target[1], point[2] - camera.target[2]];
    return [camera.width / 2 + dot(delta, camera.right) * camera.scale, (camera.annotations === false ? camera.height : camera.height + 40) / 2 - dot(delta, camera.up) * camera.scale, dot(delta, camera.back)];
  }

  /** Reads actual saved orthographic placement; it neither fits a new camera nor reconstructs a scene. */
  export function saved(value: unknown, width: number, height: number, name: string): NodeCanvasTypes.Camera {
    if (!isRecord(value) || value.projection !== "orthographic") throw new Error("The comparison requires an actual orthographic snapshot camera");
    if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width <= 0 || height <= 0) throw new Error("Actual saved canvas dimensions are invalid");
    const target: NodeCanvasTypes.Point = point(value.target);
    const position: NodeCanvasTypes.Point = point(value.position);
    const back: NodeCanvasTypes.Point = unit([position[0] - target[0], position[1] - target[1], position[2] - target[2]]);
    const right: NodeCanvasTypes.Point = unit(cross(point(value.up), back));
    const up: NodeCanvasTypes.Point = cross(back, right);
    const halfHeight: unknown = value.halfHeight;
    const zoom: unknown = value.zoom;
    if (typeof halfHeight !== "number" || !Number.isFinite(halfHeight) || halfHeight <= 0 || typeof zoom !== "number" || !Number.isFinite(zoom) || zoom <= 0) throw new Error("Saved orthographic halfHeight/zoom is unavailable");
    if (typeof value.aspect !== "number" || !Number.isFinite(value.aspect) || Math.abs(value.aspect - width / height) > 1e-12) throw new Error("Saved orthographic aspect differs from its actual canvas");
    if (typeof value.near !== "number" || typeof value.far !== "number" || !Number.isFinite(value.near) || !Number.isFinite(value.far) || value.near <= 0 || value.far <= value.near) throw new Error("Saved camera clipping is unavailable");
    return { name, target, back, right, up, scale: height * zoom / (2 * halfHeight), width, height, annotations: false, clipping: { near: value.near, far: value.far, distance: Math.hypot(position[0] - target[0], position[1] - target[1], position[2] - target[2]) } };
  }

  /** Chooses the existing direction with the greatest unscaled projected area, then extent. */
  export function direction(points: readonly NodeCanvasTypes.Point[]): string {
    let best: { name: string; area: number; extent: number } = { name: "front", area: -1, extent: -1 };
    for (const name of names()) {
      const camera: NodeCanvasTypes.Camera = fit(name, points);
      const projected: NodeCanvasTypes.Point[] = points.map((p: NodeCanvasTypes.Point): NodeCanvasTypes.Point => project(p, camera));
      const x: number = (Math.max(...projected.map((p: NodeCanvasTypes.Point): number => p[0])) - Math.min(...projected.map((p: NodeCanvasTypes.Point): number => p[0]))) / camera.scale;
      const y: number = (Math.max(...projected.map((p: NodeCanvasTypes.Point): number => p[1])) - Math.min(...projected.map((p: NodeCanvasTypes.Point): number => p[1]))) / camera.scale;
      const area: number = x * y;
      const extent: number = Math.hypot(x, y);
      if (area > best.area || area === best.area && extent > best.extent) best = { name, area, extent };
    }
    return best.name;
  }

  /** Requires a JSON object without fabricating its properties. */
  function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }

  /** Validates the saved metre vector before borrowing its numeric values. */
  function point(value: unknown): NodeCanvasTypes.Point {
    if (!Array.isArray(value) || value.length !== 3 || !value.every((entry: unknown): boolean => typeof entry === "number" && Number.isFinite(entry))) throw new Error("Saved camera vector is unavailable");
    return [Number(value[0]), Number(value[1]), Number(value[2])];
  }

  /** Euclidean scalar product on display vectors. */
  export function dot(a: NodeCanvasTypes.Point, b: NodeCanvasTypes.Point): number { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }

  /** Right-handed vector product. */
  export function cross(a: NodeCanvasTypes.Point, b: NodeCanvasTypes.Point): NodeCanvasTypes.Point { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }

  /** Normalizes only nonzero finite display vectors. */
  export function unit(point: NodeCanvasTypes.Point): NodeCanvasTypes.Point {
    const length: number = Math.hypot(...point);
    if (!(length > 0 && Number.isFinite(length))) throw new Error("Invalid display vector");
    return [point[0] / length, point[1] / length, point[2] / length];
  }
}
