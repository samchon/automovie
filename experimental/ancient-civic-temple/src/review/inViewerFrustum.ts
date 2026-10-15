import type { IAutoMovieVector3 } from "@automovie/interface";
import { templeViewerLens } from "../geometry/templeViewerLens";
import { dot } from "./dot";
import { sub } from "./sub";
import { unit } from "./unit";

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
