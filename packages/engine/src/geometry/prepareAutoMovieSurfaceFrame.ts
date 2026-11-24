import type {
  IAutoMoviePreparedSurfaceFrame,
  IAutoMovieSurfaceFrame,
  IAutoMovieSweepFrame,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { normalizeAutoMovieSurfaceFrame } from "./normalizeAutoMovieSurfaceFrame";

/**
 * Prepare exactly three finite, noncollinear metre points for rigid placement.
 * Their centroid is the origin, point 0 to point 1 is forward, and the ordered
 * edge cross product supplies the normal. Optional referenceNormal chooses its
 * sign; a zero, nonfinite or exactly perpendicular reference refuses. It does
 * not tilt the triangle. The frozen result owns its coordinates independently
 * of subsequent input edits. Finite inputs whose differences or coordinates
 * overflow refuse; near-collinearity remains a binary64 conditioning limit.
 */
export function prepareAutoMovieSurfaceFrame(
  points: readonly IAutoMovieVector3[],
  referenceNormal?: IAutoMovieVector3,
): IAutoMoviePreparedSurfaceFrame {
  if (points.length !== 3)
    throw new Error("Surface preparation requires exactly three points.");

  const first: IAutoMovieVector3 = Vector3.subtract(points[1], points[0]);
  const second: IAutoMovieVector3 = Vector3.subtract(points[2], points[0]);

  let normal: IAutoMovieVector3 = Vector3.cross(
    Vector3.normalize(first),
    Vector3.normalize(second),
  );
  if (referenceNormal !== undefined) {
    if (Vector3.length(referenceNormal) === 0)
      throw new Error("Surface reference normal must be finite and nonzero.");

    const alignment: number = Vector3.dot(
      Vector3.normalize(normal),
      Vector3.normalize(referenceNormal),
    );
    if (alignment === 0)
      throw new Error("Surface reference normal cannot select a normal sign.");
    if (alignment < 0) normal = Vector3.scale(normal, -1);
  }

  // Divide before addition so a representable centroid need not overflow its sum.
  const origin: IAutoMovieVector3 = {
    x: points[0].x / 3 + points[1].x / 3 + points[2].x / 3,
    y: points[0].y / 3 + points[1].y / 3 + points[2].y / 3,
    z: points[0].z / 3 + points[1].z / 3 + points[2].z / 3,
  };
  const basis: IAutoMovieSweepFrame = normalizeAutoMovieSurfaceFrame({
    origin,
    forward: first,
    normal,
  });
  const offsets: IAutoMovieVector3[] = points.map(
    (point: IAutoMovieVector3): IAutoMovieVector3 => {
      const delta: IAutoMovieVector3 = Vector3.subtract(point, origin);
      const offset: IAutoMovieVector3 = {
        x: Vector3.dot(delta, basis.x),
        y: Vector3.dot(delta, basis.y),
        z: Vector3.dot(delta, basis.normal),
      };
      return Object.freeze(offset);
    },
  );
  const frame: IAutoMovieSurfaceFrame = Object.freeze({
    origin: Object.freeze(basis.origin),
    forward: Object.freeze(basis.x),
    normal: Object.freeze(basis.normal),
  });
  return Object.freeze({
    frame,
    offsets: Object.freeze([offsets[0], offsets[1], offsets[2]] as const),
  });
}
