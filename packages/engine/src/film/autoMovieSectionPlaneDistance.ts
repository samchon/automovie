import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieSectionPlane } from "./IAutoMovieSectionPlane";

/**
 * Signed distance in metres from a section plane to a world point,
 * `n̂·(p − p0)`.
 *
 * Positive is the removed side, negative is the kept side, and exactly zero is
 * the plane itself, which is kept. A cut taken at a floor's own level puts every
 * vertex of that floor at exactly zero, so dropping them would delete the
 * surface the reviewer asked to stand on. `three.js` discards a fragment only at
 * a negative distance to its own plane, which the viewer builds from the negated
 * normal, so this number and the drawn pixel agree at the boundary.
 *
 * Throws a `RangeError` when the plane's normal is zero or not finite, or its
 * point is not finite, because such a plane names no half-space. A non-finite
 * query point is not refused and yields `NaN`.
 *
 * @evidence contracts/common.md#principled-implementation The point-normal form of a plane gives the signed distance as the dot product of the normal with the offset from the plane point, divided by the normal's `Math.hypot` length so a non-unit normal still answers in metres; the boundary is decided as kept here once, and every section reader inherits it.
 * @evidence contracts/common.md#clear-and-simple-design The one place the section sign convention and the degenerate-plane refusal live; `autoMovieSectionPlanesKeepPoint` and `classifyAutoMovieSectionPlaneBox` call it rather than repeating the arithmetic, so the three cannot disagree about a point on the plane.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A degenerate normal or a non-finite plane point throws instead of producing a `NaN` that `<= 0` would read as removed and the box classifier as crossed, so no caller receives a silent verdict about a plane that does not exist.
 * @evidence contracts/common.md#meaningful-documentation States the formula and unit, the meaning of each sign, why zero is kept and how that matches `three.js` through the viewer's negation, and which inputs throw and which yield `NaN`.
 * @evidence contracts/performance.md#efficient-algorithms Constant work per call: one `Math.hypot`, three finiteness checks on the plane point and one dot product; the normal's length is recomputed per call rather than cached, because the plane is a caller-owned record that may change between calls.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure scalar function with nothing coordinated across calls; a caller evaluating many points against one plane pays the constant length computation per point.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Reads the plane and the point during the call, allocates no object, and keeps no reference to either.
 */
export const autoMovieSectionPlaneDistance = (
  plane: IAutoMovieSectionPlane,
  point: IAutoMovieVector3,
): number => {
  const length: number = Math.hypot(
    plane.normal.x,
    plane.normal.y,
    plane.normal.z,
  );
  if (Number.isFinite(length) === false || length === 0)
    throw new RangeError(
      "Section plane normal must be a finite, non-zero vector.",
    );
  if (
    Number.isFinite(plane.point.x) === false ||
    Number.isFinite(plane.point.y) === false ||
    Number.isFinite(plane.point.z) === false
  )
    throw new RangeError("Section plane point must be finite.");
  return (
    (plane.normal.x * (point.x - plane.point.x) +
      plane.normal.y * (point.y - plane.point.y) +
      plane.normal.z * (point.z - plane.point.z)) /
    length
  );
};
