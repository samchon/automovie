/** Perspective/frustum audit for the complete compiled opening population. */
import { Quaternion } from "@automovie/engine";
import type { IAutoMovieBuiltEnvironment, IAutoMovieVector3 } from "@automovie/interface";
import { templeViewerLens } from "../geometry/observation-datum";
import type { TempleObservation } from "../spaces/observations";

const dot = (a: IAutoMovieVector3, b: IAutoMovieVector3): number => a.x * b.x + a.y * b.y + a.z * b.z;
const sub = (a: IAutoMovieVector3, b: IAutoMovieVector3): IAutoMovieVector3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const unit = (a: IAutoMovieVector3): IAutoMovieVector3 => {
  const length = Math.hypot(a.x, a.y, a.z);
  if (length < 1e-9) throw new Error("frustum: zero-length camera direction");
  return { x: a.x / length, y: a.y / length, z: a.z / length };
};

/** Uses the same vertical field, capture aspect, and near plane as the viewer payload. */
export const inViewerFrustum = (position: IAutoMovieVector3, target: IAutoMovieVector3, point: IAutoMovieVector3): boolean => {
  const forward = unit(sub(target, position));
  const horizontal = Math.hypot(forward.x, forward.z);
  const right = horizontal < 1e-9 ? { x: 1, y: 0, z: 0 } : unit({ x: -forward.z, y: 0, z: forward.x });
  const up = { x: -forward.y * right.z, y: right.z * forward.x - right.x * forward.z, z: forward.y * right.x };
  const ray = sub(point, position);
  const depth = dot(ray, forward);
  const halfHeight = depth * Math.tan(templeViewerLens.halfVerticalRadians);
  return depth >= templeViewerLens.near && Math.abs(dot(ray, right)) <= halfHeight * templeViewerLens.aspect + 1e-9 &&
    Math.abs(dot(ray, up)) <= halfHeight + 1e-9;
};

export interface OpeningFrustumRow {
  id: string;
  kind: string;
  roomView: string;
  roomPosition: IAutoMovieVector3;
  roomTarget: IAutoMovieVector3;
  roomCenterVisible: boolean;
  roomCornersVisible: number;
  exteriorCornersVisible: number | null;
  completeProfileFramed: boolean;
  arrivalCenterVisible: boolean | null;
}

export const openingFrustumCensus = (environment: IAutoMovieBuiltEnvironment, observations: readonly TempleObservation[]): OpeningFrustumRow[] =>
  environment.openings.map((opening) => {
    const boundary = environment.boundaries.find((entry) => entry.id === opening.boundary);
    if (boundary?.face === undefined || opening.profile === undefined) throw new Error(`frustum: ${opening.id} lacks host/profile`);
    const corners = opening.profile.outline.map((point) => {
      const delta = Quaternion.rotateVector(boundary.face!.rotation, { x: point.x, y: point.y, z: 0 });
      return { x: boundary.face!.origin.x + delta.x, y: boundary.face!.origin.y + delta.y, z: boundary.face!.origin.z + delta.z };
    });
    const center = corners.reduce((sum, corner) => ({ x: sum.x + corner.x / corners.length, y: sum.y + corner.y / corners.length, z: sum.z + corner.z / corners.length }), { x: 0, y: 0, z: 0 });
    const room = observations.find((entry) => entry.role === "opening-facing" && entry.id.endsWith(`.${opening.id}`));
    if (room?.position === undefined || room?.position === null || room.target === null) throw new Error(`frustum: ${opening.id} lacks room-facing pose`);
    const exterior = observations.find((entry) => entry.id === `exterior.opening.${opening.id}`);
    const arrival = opening.kind === "window" ? observations.find((entry) => entry.id === `sanctuary.threshold-${opening.id}`) : undefined;
    const count = (view: TempleObservation): number => view.position === null || view.target === null ? 0
      : corners.filter((point) => inViewerFrustum(view.position!, view.target!, point)).length;
    const roomCornersVisible = count(room);
    const exteriorCornersVisible = exterior === undefined ? null : count(exterior);
    return {
      id: opening.id, kind: opening.kind, roomView: room.id, roomPosition: room.position, roomTarget: room.target,
      roomCenterVisible: inViewerFrustum(room.position, room.target, center),
      roomCornersVisible, exteriorCornersVisible, completeProfileFramed: Math.max(roomCornersVisible, exteriorCornersVisible ?? 0) === corners.length,
      arrivalCenterVisible: arrival === undefined || arrival.position === null || arrival.target === null
        ? null : inViewerFrustum(arrival.position, arrival.target, center),
    };
  });
