import { IAutoMoviePlanarPoint } from "@automovie/interface";
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
