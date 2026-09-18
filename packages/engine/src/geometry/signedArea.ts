import { IAutoMovieProfilePoint } from "./IAutoMovieProfilePoint";

/** Twice the shoelace sum, halved: positive counter-clockwise, in m².
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Measures the orientation and area of a metric construction ring.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Supplies the signed shoelace area used to preserve ring correspondence and winding.
 */
export const signedArea = (
  points: readonly IAutoMovieProfilePoint[],
): number => {
  let total = 0;
  for (let index = 0; index < points.length; ++index) {
    const from = points[index]!;
    const to = points[(index + 1) % points.length]!;
    total += from.x * to.y - to.x * from.y;
  }
  return total / 2;
};
