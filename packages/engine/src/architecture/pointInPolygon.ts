import { IAutoMoviePlanarPoint } from "@automovie/interface";

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
