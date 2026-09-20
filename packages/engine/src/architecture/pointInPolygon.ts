import { IAutoMoviePlanarPoint } from "@automovie/interface";
import { PLANAR_EPSILON } from "../geometry/constants/PLANAR_EPSILON";

/**
 * Whether a point is inside a simple polygon, its own boundary included.
 *
 * Exported because the service-network validator locates a port on a boundary
 * face with it: one planar containment answer for the whole architecture graph
 * is the point of keeping these predicates in one module.
 *
 * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation `pointInPolygon` produces whether a point is inside a simple polygon, its own boundary included. This ensures degenerate or self-intersecting planar geometry is rejected before use.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure `pointInPolygon` classifies a finite point against a simple polygon while treating its boundary as inside.
 */
export const pointInPolygon = (
  point: IAutoMoviePlanarPoint,
  polygon: readonly IAutoMoviePlanarPoint[],
): boolean => {
  for (let index = 0; index < polygon.length; ++index)
    if (
      pointOnSegment(
        point,
        polygon[index]!,
        polygon[(index + 1) % polygon.length]!,
      )
    )
      return true;
  let inside = false;
  for (let index = 0; index < polygon.length; ++index) {
    const from = polygon[index]!;
    const to = polygon[(index + 1) % polygon.length]!;
    if (
      from.y > point.y !== to.y > point.y &&
      point.x <
        from.x + ((point.y - from.y) / (to.y - from.y)) * (to.x - from.x)
    )
      inside = !inside;
  }
  return inside;
};

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
