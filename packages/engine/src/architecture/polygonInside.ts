import { IAutoMoviePlanarPoint } from "@automovie/interface";
import { pointInPolygon } from "./pointInPolygon";

/**
 * Whether an inner polygon stays within an outer one, flush edges allowed.
 *
 * Only a crossing counts against containment, so a void whose sill lies exactly
 * on the wall's own bottom edge is contained, while a void whose corner pokes
 * through the wall's side is not.
 *
 * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation `polygonInside` produces whether an inner polygon stays within an outer one, flush edges allowed. This ensures degenerate or self-intersecting planar geometry is rejected before use.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure `polygonInside` performs inside polygon calculation when the engine checks finite planar topology before consuming geometry.
 */
export const polygonInside = (
  inner: readonly IAutoMoviePlanarPoint[],
  outer: readonly IAutoMoviePlanarPoint[],
): boolean => {
  if (inner.some((point) => pointInPolygon(point, outer) === false))
    return false;
  for (let index = 0; index < inner.length; ++index)
    for (let other = 0; other < outer.length; ++other)
      if (
        segmentsCross(
          inner[index]!,
          inner[(index + 1) % inner.length]!,
          outer[other]!,
          outer[(other + 1) % outer.length]!,
        )
      )
        return false;
  return true;
};
