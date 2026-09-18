import { IAutoMoviePlanarPoint } from "@automovie/interface";

/**
 * Whether a closed polygon never crosses or touches itself away from a shared
 * corner.
 *
 * A self-crossing outline has no interior, so every later question about what
 * is inside it would answer arbitrarily. Adjacent edges are skipped because
 * they legitimately meet at the corner they share.
 *
 * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation `polygonIsSimple` produces whether a closed polygon never crosses or touches itself away from a shared corner. This ensures degenerate or self-intersecting planar geometry is rejected before use.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure `polygonIsSimple` performs is simple polygon calculation when the engine checks finite planar topology before consuming geometry.
 */
export const polygonIsSimple = (
  polygon: readonly IAutoMoviePlanarPoint[],
): boolean => {
  const count = polygon.length;
  for (let left = 0; left < count; ++left)
    for (let right = left + 1; right < count; ++right) {
      const adjacent =
        right === left + 1 || (left === 0 && right === count - 1);
      if (adjacent) continue;
      if (
        segmentsTouch(
          polygon[left]!,
          polygon[(left + 1) % count]!,
          polygon[right]!,
          polygon[(right + 1) % count]!,
        )
      )
        return false;
    }
  return true;
};
