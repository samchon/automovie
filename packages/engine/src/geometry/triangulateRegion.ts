import { IAutoMovieProfilePoint } from "./IAutoMovieProfilePoint";
import { IAutoMovieRegionTriangulation } from "./IAutoMovieRegionTriangulation";
import { canonicalRegion } from "./canonicalRegion";
import { trianglesOf } from "./trianglesOf";

/** One canonical region, bridged into a single ring and ear-clipped. */
export const triangulateRegion = (
  outer: readonly IAutoMovieProfilePoint[],
  holes: ReadonlyArray<readonly IAutoMovieProfilePoint[]>,
  label: string,
): IAutoMovieRegionTriangulation => {
  const region = canonicalRegion(outer, holes, label);
  return { ...region, triangles: trianglesOf(region) };
};
