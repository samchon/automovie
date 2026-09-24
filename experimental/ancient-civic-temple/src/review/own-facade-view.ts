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

export interface OwnFacadeRow { id: string; sampled: number; visible: number; ratio: number }

/** Exposed porch and retreat-wall faces are sampled at 5 cm on the camera-facing side. */
export const ownReturnFacadeViews = (environment: IAutoMovieBuiltEnvironment, observations: readonly TempleObservation[]): OwnFacadeRow[] => {
  const triangles = emittedTriangles(environment);
  const ids = environment.boundaries.filter((b) => /^boundary-entrance-return-(west|east)\.(outer-upper|front)$/.test(b.id) ||
    /^boundary-entry\.(west|east)-(end|side)\.upper$/.test(b.id));
  return ids.map((boundary) => {
    const id = `exterior.facade.${boundary.id}`;
    const observation = observations.find((item) => item.id === id);
    if (boundary.face === undefined || observation?.position === null || observation?.position === undefined || observation.target === null) {
      throw new Error(`own view: missing face or pose for ${id}`);
    }
    const face = boundary.face;
    const normal = Quaternion.rotateVector(face.rotation, { x: 0, y: 0, z: 1 });
    const horizontal = Quaternion.rotateVector(face.rotation, { x: 1, y: 0, z: 0 });
    const sign = Math.sign(dot(sub(observation.position, face.origin), normal));
    const look = unit(sub(observation.target, observation.position));
    const right = unit(cross(look, { x: 0, y: 1, z: 0 }));
    const up = cross(right, look);
    const tanVertical = Math.tan(25 * Math.PI / 180);
    const u0 = Math.min(...face.outline.map((point) => point.x));
    const u1 = Math.max(...face.outline.map((point) => point.x));
    const v0 = Math.min(...face.outline.map((point) => point.y));
    const v1 = Math.max(...face.outline.map((point) => point.y));
    let sampled = 0, visible = 0;
    for (let u = u0 + 0.025; u < u1; u += 0.05) {
      for (let v = v0 + 0.025; v < v1; v += 0.05) {
        if (!pointInOutline(face.outline, u, v)) continue;
        const point = { x: face.origin.x + horizontal.x * u + normal.x * sign * face.thickness / 2,
          y: face.origin.y + v, z: face.origin.z + horizontal.z * u + normal.z * sign * face.thickness / 2 };
        sampled++;
        const delta = sub(point, observation.position);
        const forward = dot(delta, look);
        if (forward <= 0.05 || Math.abs(dot(delta, right) / forward) > tanVertical * 1.6 ||
          Math.abs(dot(delta, up) / forward) > tanVertical) continue;
        const length = Math.hypot(delta.x, delta.y, delta.z);
        const direction = unit(delta);
        const origin = { x: observation.position.x + 0.000137, y: observation.position.y + 0.000211, z: observation.position.z + 0.000291 };
        if (!triangles.some((triangle) => {
          const hit = rayTriangle(origin, direction, triangle);
          return hit !== null && hit < length - 0.03;
        })) visible++;
      }
    }
    return { id: boundary.id, sampled, visible, ratio: sampled === 0 ? 0 : visible / sampled };
  });
};
