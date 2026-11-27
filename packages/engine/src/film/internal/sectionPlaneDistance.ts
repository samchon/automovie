import {
  type IAutoMovieSectionPlane,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * Signed distance in metres from a section plane to a world point, `n̂·(p −
 * p0)`.
 *
 * Positive is the removed side, negative is the kept side, and exactly zero is
 * the plane itself, which is kept. A cut taken at a floor's own level puts
 * every vertex of that floor at exactly zero, so dropping them would delete the
 * surface the reviewer asked to stand on. `three.js` discards a fragment only
 * at a negative distance to its own plane, which the viewer builds from the
 * negated normal, so this number and the drawn pixel agree at the boundary.
 *
 * Throws a `RangeError` when the plane's normal is zero or not finite, or its
 * point is not finite, because such a plane names no half-space. A non-finite
 * query point is not refused and yields `NaN`.
 */
export const sectionPlaneDistance = (
  plane: IAutoMovieSectionPlane,
  point: IAutoMovieVector3,
): number => {
  const length: number = Math.hypot(
    plane.normal.x,
    plane.normal.y,
    plane.normal.z,
  );
  if (length === 0)
    throw new RangeError("Section plane normal must be a non-zero vector.");

  return (
    (plane.normal.x * (point.x - plane.point.x) +
      plane.normal.y * (point.y - plane.point.y) +
      plane.normal.z * (point.z - plane.point.z)) /
    length
  );
};
