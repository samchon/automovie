import type {
  IAutoMoviePreparedSurfaceFrame,
  IAutoMovieSurfaceFrame,
  IAutoMovieSweepFrame,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";
import { normalizeAutoMovieSurfaceFrame } from "./normalizeAutoMovieSurfaceFrame";

/*
 * Prepare exactly three finite, noncollinear metre points for rigid placement.
 * Their centroid is the origin, point 0 to point 1 is forward, and the ordered
 * edge cross product supplies the normal. Optional referenceNormal chooses its
 * sign; a zero, nonfinite or exactly perpendicular reference refuses. It does
 * not tilt the triangle. The result owns its coordinates independently of
 * subsequent input edits. Finite inputs whose differences or coordinates
 * overflow refuse; near-collinearity remains a binary64 conditioning limit.
 */
export function prepareAutoMovieSurfaceFrame(
  points: readonly IAutoMovieVector3[],
  referenceNormal?: IAutoMovieVector3,
): IAutoMoviePreparedSurfaceFrame {
  if (points.length !== 3)
    throw new Error("Surface preparation requires exactly three points.");

  const first: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(points[1], points[0]);
  const second: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(points[2], points[0]);

  // Differences of finite points can overflow binary64.
  if (!AutoMovieEngineVector3.isFinite(first) || !AutoMovieEngineVector3.isFinite(second))
    throw new Error("Surface point differences exceed finite coordinates.");

  let normal: IAutoMovieVector3 = AutoMovieEngineVector3.cross(
    AutoMovieEngineVector3.normalize(first),
    AutoMovieEngineVector3.normalize(second),
  );
  if (referenceNormal !== undefined) {
    if (
      !AutoMovieEngineVector3.isFinite(referenceNormal) ||
      AutoMovieEngineVector3.length(referenceNormal) === 0
    )
      throw new Error("Surface reference normal must be finite and nonzero.");

    const alignment: number = AutoMovieEngineVector3.dot(
      AutoMovieEngineVector3.normalize(normal),
      AutoMovieEngineVector3.normalize(referenceNormal),
    );
    if (alignment === 0)
      throw new Error("Surface reference normal cannot select a normal sign.");
    if (alignment < 0) normal = AutoMovieEngineVector3.scale(normal, -1);
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
      const delta: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(point, origin);
      const offset: IAutoMovieVector3 = {
        x: AutoMovieEngineVector3.dot(delta, basis.x),
        y: AutoMovieEngineVector3.dot(delta, basis.y),
        z: AutoMovieEngineVector3.dot(delta, basis.normal),
      };
      if (!AutoMovieEngineVector3.isFinite(offset))
        throw new Error("Surface offsets exceed finite coordinates.");
      return offset;
    },
  );
  const frame: IAutoMovieSurfaceFrame = {
    origin: basis.origin,
    forward: basis.x,
    normal: basis.normal,
  };
  return {
    frame,
    offsets: [offsets[0], offsets[1], offsets[2]] as const,
  };
}
