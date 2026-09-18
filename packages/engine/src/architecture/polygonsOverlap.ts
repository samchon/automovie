import { IAutoMoviePlanarPoint } from "@automovie/interface";
import { PLANAR_EPSILON } from "../geometry/constants/PLANAR_EPSILON";
import { pointInPolygon } from "./pointInPolygon";

/**
 * Whether two polygons share any point at all, contact included.
 *
 * Contact counts because two voids meeting exactly along a jamb are one void
 * written twice, and the wall between them has nothing left to be.
 *
 * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation `polygonsOverlap` produces whether two polygons share any point at all, contact included. This ensures degenerate or self-intersecting planar geometry is rejected before use.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure `polygonsOverlap` detects shared interior or boundary contact between two finite polygons.
 */
export const polygonsOverlap = (
  left: readonly IAutoMoviePlanarPoint[],
  right: readonly IAutoMoviePlanarPoint[],
): boolean => {
  for (let index = 0; index < left.length; ++index)
    for (let other = 0; other < right.length; ++other)
      if (
        segmentsTouch(
          left[index]!,
          left[(index + 1) % left.length]!,
          right[other]!,
          right[(other + 1) % right.length]!,
        )
      )
        return true;
  return (
    pointInPolygon(left[0]!, right) === true ||
    pointInPolygon(right[0]!, left) === true
  );
};

/** Whether two segments meet at a point interior to both. */
const segmentsCross = (
  a: IAutoMoviePlanarPoint,
  b: IAutoMoviePlanarPoint,
  c: IAutoMoviePlanarPoint,
  d: IAutoMoviePlanarPoint,
): boolean => {
  const first = side(c, d, a);
  const second = side(c, d, b);
  const third = side(a, b, c);
  const fourth = side(a, b, d);
  return (
    first !== 0 &&
    second !== 0 &&
    third !== 0 &&
    fourth !== 0 &&
    first !== second &&
    third !== fourth
  );
};

/** Whether two segments share any point, endpoints and overlap included. */
const segmentsTouch = (
  a: IAutoMoviePlanarPoint,
  b: IAutoMoviePlanarPoint,
  c: IAutoMoviePlanarPoint,
  d: IAutoMoviePlanarPoint,
): boolean =>
  segmentsCross(a, b, c, d) ||
  pointOnSegment(a, c, d) ||
  pointOnSegment(b, c, d) ||
  pointOnSegment(c, a, b) ||
  pointOnSegment(d, a, b);

/** Which side of the directed line `from -> to` a point falls on. */
const side = (
  from: IAutoMoviePlanarPoint,
  to: IAutoMoviePlanarPoint,
  point: IAutoMoviePlanarPoint,
): number => {
  const cross =
    (to.x - from.x) * (point.y - from.y) - (to.y - from.y) * (point.x - from.x);
  const scale = Math.max(
    1,
    Math.abs(to.x - from.x) + Math.abs(to.y - from.y),
    Math.abs(point.x - from.x) + Math.abs(point.y - from.y),
  );
  if (Math.abs(cross) <= PLANAR_EPSILON * scale) return 0;
  return cross > 0 ? 1 : -1;
};

/** Whether a point lies on a segment, its endpoints included. */
const pointOnSegment = (
  point: IAutoMoviePlanarPoint,
  from: IAutoMoviePlanarPoint,
  to: IAutoMoviePlanarPoint,
): boolean =>
  side(from, to, point) === 0 &&
  point.x >= Math.min(from.x, to.x) - PLANAR_EPSILON &&
  point.x <= Math.max(from.x, to.x) + PLANAR_EPSILON &&
  point.y >= Math.min(from.y, to.y) - PLANAR_EPSILON &&
  point.y <= Math.max(from.y, to.y) + PLANAR_EPSILON;
