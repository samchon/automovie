import { builtSpaceContainsPoint } from "@automovie/engine";
import type {
  IAutoMovieBuiltEnvironment,
  IAutoMovieVector3,
} from "@automovie/interface";

type Point = { x: number; z: number };
const cross = (a: Point, b: Point) => a.x * b.z - a.z * b.x;
const delta = (a: Point, b: Point) => ({ x: a.x - b.x, z: a.z - b.z });
const dot = (a: Point, b: Point) => a.x * b.x + a.z * b.z;
const distance = (p: Point, a: Point, b: Point) => {
  const edge = delta(b, a),
    q = delta(p, a),
    length = dot(edge, edge);
  const t = length ? Math.max(0, Math.min(1, dot(q, edge) / length)) : 0;
  return Math.hypot(q.x - t * edge.x, q.z - t * edge.z);
};
function touches(
  point: Point,
  polygon: readonly Point[],
  radius: number,
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i],
      b = polygon[j];
    if (distance(point, a, b) <= radius + 1e-9) return true;
    if (
      a.z > point.z !== b.z > point.z &&
      point.x < ((b.x - a.x) * (point.z - a.z)) / (b.z - a.z) + a.x
    )
      inside = !inside;
  }
  return inside;
}
/** Exact event parameters where a moving disc touches a polygon edge or vertex. */
function events(
  a: Point,
  b: Point,
  polygon: readonly Point[],
  radius: number,
): number[] {
  const motion = delta(b, a),
    speed2 = dot(motion, motion),
    out: number[] = [];
  if (!speed2) return out;
  for (let i = 0; i < polygon.length; i++) {
    const p = polygon[i],
      q = polygon[(i + 1) % polygon.length],
      edge = delta(q, p),
      length = Math.sqrt(dot(edge, edge));
    const denominator = cross(edge, motion);
    if (length && Math.abs(denominator) > 1e-12)
      for (const sign of [-1, 1]) {
        const t =
          (sign * radius * length - cross(edge, delta(a, p))) / denominator;
        const projection =
          dot(
            delta({ x: a.x + t * motion.x, z: a.z + t * motion.z }, p),
            edge,
          ) /
          (length * length);
        if (t > 0 && t < 1 && projection >= 0 && projection <= 1) out.push(t);
      }
    const offset = delta(a, p),
      linear = 2 * dot(offset, motion),
      constant = dot(offset, offset) - radius * radius;
    const discriminant = linear * linear - 4 * speed2 * constant;
    if (discriminant >= 0)
      for (const sign of [-1, 1]) {
        const t = (-linear + sign * Math.sqrt(discriminant)) / (2 * speed2);
        if (t > 0 && t < 1) out.push(t);
      }
  }
  return out;
}

/** A continuous geometric cylinder traversal, not a human gait simulation.
 * At the first disc contact with a higher authored walk surface the base lifts
 * vertically, then advances horizontally. Every body and support remains in
 * the collision population. Contact events use actual constant-height polygons. */
export function stairCylinderPath(
  environment: IAutoMovieBuiltEnvironment,
  route: readonly IAutoMovieVector3[],
  from: string,
  radius = 0.3,
): IAutoMovieVector3[] {
  if (route.length < 2 || !Number.isFinite(radius) || radius <= 0)
    throw new Error("stair cylinder needs a route and positive radius");
  const surfaces = environment.surfaces
    .filter((s) => s.surface.kind === "floor")
    .map(({ surface }) => {
      if (surface.height?.kind !== "constant" || surface.polygon.length < 3)
        throw new Error(
          `stair cylinder unsupported walk surface ${surface.id}`,
        );
      return {
        id: surface.id,
        polygon: surface.polygon,
        y: surface.height.value,
      };
    });
  const first = route[0],
    next = route[1],
    length = Math.hypot(next.x - first.x, next.z - first.z);
  if (!length)
    throw new Error("stair cylinder approach needs horizontal direction");
  const lead = {
    x: first.x - ((next.x - first.x) / length) * radius,
    y: first.y,
    z: first.z - ((next.z - first.z) / length) * radius,
  };
  const space = environment.spaces.find((s) => s.id === from);
  if (!space || !builtSpaceContainsPoint(space, lead))
    throw new Error("stair cylinder approach leaves its entry space");
  const centers = [lead, ...route],
    out: IAutoMovieVector3[] = [lead];
  let height = first.y;
  // An upper-storey floor can share X/Z with the lower approach. It is an
  // overhead obstacle there, not a walk surface reachable in one actual rise.
  const rise = Math.max(
    ...route.slice(1).map((p, i) => Math.abs(p.y - route[i].y)),
  );
  for (let i = 0; i + 1 < centers.length; i++) {
    const a = centers[i],
      b = centers[i + 1];
    const ts = [
      0,
      1,
      ...surfaces.flatMap((s) => events(a, b, s.polygon, radius)),
    ]
      .sort((x, y) => x - y)
      .filter((t, index, all) => index === 0 || t - all[index - 1] > 1e-9);
    for (let j = 0; j + 1 < ts.length; j++) {
      const middle = (ts[j] + ts[j + 1]) / 2;
      const probe = {
        x: a.x + (b.x - a.x) * middle,
        z: a.z + (b.z - a.z) * middle,
      };
      const contacted = surfaces.filter(
        (s) =>
          s.y <= Math.max(a.y, b.y) + rise + 1e-7 &&
          touches(probe, s.polygon, radius),
      );
      if (!contacted.length)
        throw new Error(`stair cylinder unsupported interval ${i}/${j}`);
      const support = Math.max(...contacted.map((s) => s.y));
      if (support < height - 1e-7)
        throw new Error(`stair cylinder loses ${height}m support at ${i}/${j}`);
      const begin = {
        x: a.x + (b.x - a.x) * ts[j],
        y: height,
        z: a.z + (b.z - a.z) * ts[j],
      };
      out.push(begin);
      if (support > height) {
        height = support;
        out.push({ ...begin, y: height });
      }
      out.push({
        x: a.x + (b.x - a.x) * ts[j + 1],
        y: height,
        z: a.z + (b.z - a.z) * ts[j + 1],
      });
    }
  }
  if (Math.abs(height - route.at(-1)!.y) > 1e-7)
    throw new Error(
      "stair cylinder finishes above or below its destination floor",
    );
  return out.filter(
    (p, i) =>
      i === 0 ||
      Math.hypot(p.x - out[i - 1].x, p.y - out[i - 1].y, p.z - out[i - 1].z) >
        1e-9,
  );
}
