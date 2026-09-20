import { IAutoMovieVector3 } from "@automovie/interface";
import { IAutoMovieSectionPlane } from "./IAutoMovieSectionPlane";

/**
 * Signed distance from a section plane to a world point, `n̂·(p − p0)`, metres.
 *
 * Positive is the removed side, negative is the kept side, and exactly zero is
 * the plane itself, which is KEPT. The boundary has to be decided somewhere and
 * it is decided here, because a cut taken at a floor's own level puts every
 * vertex of that floor at exactly zero: dropping them would delete the surface
 * the reviewer asked to stand on. `three.js` resolves its own clipping the same
 * way — a fragment is discarded only at negative signed distance to its plane —
 * so this number and the pixel the renderer draws agree at the boundary instead
 * of disagreeing by one plane.
 *
 * @evidence requirements/camera/clipping-occlusion-and-spatial-constraints.md#camera-clipping-range Measures a world point against the declared cut and keeps geometry lying exactly on the plane.
 * @evidence specifications/camera-light-and-visibility/visibility-and-image-space-observation.md#clv-clipping-clearance-evaluation Implements the specified signed distance `n·(p − p0)` with zero declared on the kept side.
 */
export const autoMovieSectionPlaneDistance = (
  plane: IAutoMovieSectionPlane,
  point: IAutoMovieVector3,
): number => {
  const length = Math.hypot(plane.normal.x, plane.normal.y, plane.normal.z);
  if (Number.isFinite(length) === false || length === 0)
    throw new RangeError(
      "Section plane normal must be a finite, non-zero vector.",
    );
  return (
    (plane.normal.x * (point.x - plane.point.x) +
      plane.normal.y * (point.y - plane.point.y) +
      plane.normal.z * (point.z - plane.point.z)) /
    length
  );
};
