import { Matrix4, Quaternion, Vector3 } from "three";
import type { IAutoMovieBuiltEnvironment, IAutoMovieMesh, IAutoMovieTransform, IAutoMovieVector3, IAutoMovieQuaternion } from "@automovie/interface";
type Point = { x: number; z: number };
type Placement = { node: string; model: string; position: IAutoMovieVector3; rotation: IAutoMovieQuaternion; scale: IAutoMovieVector3 };
type Model = { id: string; parts: { mesh: IAutoMovieMesh; transform: IAutoMovieTransform | null }[] };
const matrix = (p: IAutoMovieVector3, q: IAutoMovieQuaternion, s: IAutoMovieVector3) => new Matrix4().compose(new Vector3().copy(p), new Quaternion().copy(q), new Vector3().copy(s));
const distance = (p: Point, a: Point, b: Point) => { const dx = b.x - a.x, dz = b.z - a.z, d = dx * dx + dz * dz; const t = d ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / d)) : 0; return Math.hypot(p.x - a.x - t * dx, p.z - a.z - t * dz); };
const cross = (a: Point, b: Point, c: Point) => (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x);
function intersects(a: Point, b: Point, c: Point, d: Point): boolean {
  return cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0;
}
function inside(p: Point, poly: Point[]): boolean {
  let answer = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) if ((poly[i].z > p.z) !== (poly[j].z > p.z) && p.x < (poly[j].x - poly[i].x) * (p.z - poly[i].z) / (poly[j].z - poly[i].z) + poly[i].x) answer = !answer;
  return answer;
}
function clip(points: Vector3[], y: number, above: boolean): Vector3[] {
  const output: Vector3[] = [];
  for (let i = 0; i < points.length; i++) {
    const p = points[i], q = points[(i + 1) % points.length], pin = above ? p.y >= y : p.y <= y, qin = above ? q.y >= y : q.y <= y;
    if (pin) output.push(p);
    if (pin !== qin) output.push(p.clone().lerp(q, (y - p.y) / (q.y - p.y)));
  }
  return output;
}
/** Sweeps the declared 0.60m by 1.80m vertical cylinder along each level passage
 * polyline against actual lowered triangles. No hidden collision boxes are used.
 * This does not measure circulation inside rooms or the rise over stair treads. */
export function passageClearance(props: { environment: IAutoMovieBuiltEnvironment; models: Model[]; placements: Placement[] }) {
  const radius = 0.3, height = 1.8, tolerance = 0.001;
  const models = new Map(props.models.map((m) => [m.id, m]));
  const results: { id: string; status: "clear" | "blocked" | "unverified"; obstacles: string[]; reason: string }[] = [];
  for (const route of props.environment.connectors) {
    if (route.kind !== "passage" || route.route.some((p) => Math.abs(p.y - route.route[0].y) > tolerance)) { results.push({ id: route.id, status: "unverified", obstacles: [], reason: "stepped route needs a separate stair clearance instrument" }); continue; }
    const y0 = route.route[0].y + tolerance, y1 = route.route[0].y + height;
    const minX = Math.min(...route.route.map((p) => p.x)) - radius, maxX = Math.max(...route.route.map((p) => p.x)) + radius;
    const minZ = Math.min(...route.route.map((p) => p.z)) - radius, maxZ = Math.max(...route.route.map((p) => p.z)) + radius;
    const obstacles = new Set<string>();
    for (const placement of props.placements) {
      const model = models.get(placement.model)!;
      const world = matrix(placement.position, placement.rotation, placement.scale);
      for (const part of model.parts) {
        const transform = world.clone(); if (part.transform) transform.multiply(matrix(part.transform.translation, part.transform.rotation, part.transform.scale));
        const vertices: Vector3[] = [];
        for (let i = 0; i < part.mesh.positions.length; i += 3) vertices.push(new Vector3(part.mesh.positions[i], part.mesh.positions[i + 1], part.mesh.positions[i + 2]).applyMatrix4(transform));
        if (vertices.every((p) => p.y < y0) || vertices.every((p) => p.y > y1) || vertices.every((p) => p.x < minX) || vertices.every((p) => p.x > maxX) || vertices.every((p) => p.z < minZ) || vertices.every((p) => p.z > maxZ)) continue;
        const indices = part.mesh.indices ?? vertices.map((_, i) => i);
        for (let i = 0; i < indices.length; i += 3) {
          const polygon = clip(clip([vertices[indices[i]], vertices[indices[i + 1]], vertices[indices[i + 2]]], y0, true), y1, false);
          if (!polygon.length) continue;
          for (let j = 0; j + 1 < route.route.length; j++) {
            const a = route.route[j], b = route.route[j + 1];
            const hit = inside(a, polygon) || inside(b, polygon) || polygon.some((p, k) => { const q = polygon[(k + 1) % polygon.length]; return intersects(a, b, p, q) || Math.min(distance(p, a, b), distance(q, a, b), distance(a, p, q), distance(b, p, q)) < radius - tolerance; });
            if (hit) { obstacles.add(placement.node); break; }
          }
          if (obstacles.has(placement.node)) break;
        }
      }
    }
    results.push({ id: route.id, status: obstacles.size ? "blocked" : "clear", obstacles: [...obstacles].sort((a, b) => a.localeCompare(b)), reason: "actual triangle sweep; radius0.30,height1.80,tolerance0.001m; connector segment only" });
  }
  return results;
}
