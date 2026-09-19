import { IAutoMovieProfilePoint } from "./IAutoMovieProfilePoint";
import { IAutoMovieRegionTriangulation } from "./IAutoMovieRegionTriangulation";
import { canonicalRegion } from "./canonicalRegion";
import { trianglesOf } from "./trianglesOf";

/** One canonical region, bridged into a single ring and ear-clipped.
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Resolves an admitted planar region into triangles while retaining its holes.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Combines canonical ring admission with deterministic bridged ear clipping.
 */
export const triangulateRegion = (
  outer: readonly IAutoMovieProfilePoint[],
  holes: ReadonlyArray<readonly IAutoMovieProfilePoint[]>,
  label: string,
): IAutoMovieRegionTriangulation => {
  const region = canonicalRegion(outer, holes, label);
  return { ...region, triangles: trianglesOf(region) };
};
