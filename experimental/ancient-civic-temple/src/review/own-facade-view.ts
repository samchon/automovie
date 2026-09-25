/** Measures whether a facade's own inspection camera can see its emitted face, not just its boundary ID. */
import { Quaternion } from "@automovie/engine";
import type { IAutoMovieBuiltEnvironment, IAutoMovieVector3 } from "@automovie/interface";
import type { TempleObservation } from "../spaces/observations";
import { emittedTriangles, pointInOutline, rayTriangle } from "./address-coverage";

type Vector = IAutoMovieVector3;
const sub = (a: Vector, b: Vector): Vector => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const dot = (a: Vector, b: Vector): number => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a: Vector, b: Vector): Vector => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
const unit = (a: Vector): Vector => { const length = Math.hypot(a.x, a.y, a.z); return { x: a.x / length, y: a.y / length, z: a.z / length }; };

export interface OwnFacadeSide { sign: -1 | 1; addressSide: boolean; sampled: number; visible: number; ratio: number }
export interface OwnFacadeRow { id: string; sides: OwnFacadeSide[] }
export const ownFacadeFailures = (rows: readonly OwnFacadeRow[], minimum = 0.5): string[] =>
  rows.filter((row) => !row.sides.some((side) => side.addressSide && side.ratio >= minimum)).map((row) => row.id);

/** Every one-space facade is sampled on both emitted sides at 5 cm; the addressed side must be visible. */
export const ownFacadeViews = (environment: IAutoMovieBuiltEnvironment, observations: readonly TempleObservation[]): OwnFacadeRow[] => {
  const triangles = emittedTriangles(environment);
  const ids = environment.boundaries.filter((b) => b.spaces.length === 1 && b.face !== undefined);
  return ids.map((boundary) => {
    const id = `exterior.facade.${boundary.id}`;
    const observation = observations.find((item) => item.id === id);
    if (boundary.face === undefined || observation?.position === null || observation?.position === undefined || observation.target === null) {
      throw new Error(`own view: missing face or pose for ${id}`);
    }
    const face = boundary.face;
    const own = triangles.filter((triangle) => boundary.elements.includes(triangle.element));
    const normal = Quaternion.rotateVector(face.rotation, { x: 0, y: 0, z: 1 });
    const horizontal = Quaternion.rotateVector(face.rotation, { x: 1, y: 0, z: 0 });
    const cameraSign = Math.sign(dot(sub(observation.position, face.origin), normal));
    const opposedFace = boundary.elements.includes("element.wall.facade-south.pediment");
    const look = unit(sub(observation.target, observation.position));
    const right = unit(cross(look, { x: 0, y: 1, z: 0 }));
    const up = cross(right, look);
    const nearY = Math.min(observation.position.y, ...face.outline.map((point) => point.y)) - 0.04;
    const farY = Math.max(observation.position.y, ...face.outline.map((point) => point.y)) + 0.04;
    const possibleOccluders = triangles.filter((triangle) => triangle.maxY >= nearY && triangle.minY <= farY);
    const tanVertical = Math.tan(25 * Math.PI / 180);
    const u0 = Math.min(...face.outline.map((point) => point.x));
    const u1 = Math.max(...face.outline.map((point) => point.x));
    const v0 = Math.min(...face.outline.map((point) => point.y));
    const v1 = Math.max(...face.outline.map((point) => point.y));
    const sides: OwnFacadeSide[] = [];
    for (const sign of [1, -1] as const) {
    let sampled = 0, visible = 0;
    for (let u = u0 + 0.025; u < u1; u += 0.05) {
      for (let v = v0 + 0.025; v < v1; v += 0.05) {
        if (!pointInOutline(face.outline, u, v)) continue;
        const point = { x: face.origin.x + horizontal.x * u + normal.x * sign * face.thickness / 2,
          y: face.origin.y + v, z: face.origin.z + horizontal.z * u + normal.z * sign * face.thickness / 2 };
        const probe = { x: point.x + normal.x * sign * 0.004, y: point.y + 0.000113, z: point.z + normal.z * sign * 0.004 };
        if (!own.some((triangle) => {
          const hit = rayTriangle(probe, { x: -normal.x * sign, y: 0, z: -normal.z * sign }, triangle);
          return hit !== null && hit < 0.008;
        })) continue;
        sampled++;
        const delta = sub(point, observation.position);
        const forward = dot(delta, look);
        if (forward <= 0.05 || Math.abs(dot(delta, right) / forward) > tanVertical * 1.6 ||
          Math.abs(dot(delta, up) / forward) > tanVertical) continue;
        const length = Math.hypot(delta.x, delta.y, delta.z);
        const direction = unit(delta);
        const origin = { x: observation.position.x + 0.000137, y: observation.position.y + 0.000211, z: observation.position.z + 0.000291 };
        const x0 = Math.min(origin.x, point.x) - 0.04, x1 = Math.max(origin.x, point.x) + 0.04;
        const y0 = Math.min(origin.y, point.y) - 0.04, y1 = Math.max(origin.y, point.y) + 0.04;
        const z0 = Math.min(origin.z, point.z) - 0.04, z1 = Math.max(origin.z, point.z) + 0.04;
        if (!possibleOccluders.some((triangle) => {
          if (triangle.maxX < x0 || triangle.minX > x1 || triangle.maxY < y0 || triangle.minY > y1 ||
            triangle.maxZ < z0 || triangle.minZ > z1) return false;
          const hit = rayTriangle(origin, direction, triangle);
          return hit !== null && hit < length - 0.03;
        })) visible++;
      }
    }
    if (sampled > 0) sides.push({ sign, addressSide: sign === (opposedFace ? 1 : cameraSign), sampled, visible,
      ratio: visible / sampled });
    }
    return { id: boundary.id, sides };
  });
};
