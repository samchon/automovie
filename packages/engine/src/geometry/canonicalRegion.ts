import { IAutoMovieProfilePoint } from "./IAutoMovieProfilePoint";
import { IAutoMovieRegionRing } from "./IAutoMovieRegionRing";
import { IAutoMovieRegionTriangulation } from "./IAutoMovieRegionTriangulation";
import { autoMoviePlanarRegionFailure } from "./planarRegion";
import { signedArea } from "./signedArea";

/**
 * Validate one region and lay its rings out canonically, naming them the way
 * its caller calls them.
 *
 * The public entry says `polygon`, a loft says which section it is checking, so
 * an author reading a refusal learns which of six sections carries the ring
 * that crosses itself rather than that "the outer ring" does.
 *
 * Triangles are not cut here, because a loft needs every section validated and
 * laid out but only triangulates the two it caps with. Cutting them for all of
 * them would be work thrown away, which is also a claim in the code that the
 * middle sections are triangulated when nothing reads those triangles.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Normalizes validated outer and hole rings without inventing vertices or changing the caller.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Returns copied canonical rings and signed area for extrusion and loft correspondence.
 */
export const canonicalRegion = (
  outer: readonly IAutoMovieProfilePoint[],
  holes: ReadonlyArray<readonly IAutoMovieProfilePoint[]>,
  label: string,
): Omit<IAutoMovieRegionTriangulation, "triangles"> => {
  const failure = autoMoviePlanarRegionFailure({ outer, holes, label });
  if (failure !== null) throw new Error(failure);
  const loops = [outer, ...holes].map((ring, index) =>
    orientedRing(
      ring.map((point) => ({ x: point.x, y: point.y })),
      index === 0,
    ),
  );
  const points: IAutoMovieProfilePoint[] = [];
  const sourceIndices: number[] = [];
  const rings: IAutoMovieRegionRing[] = [];
  for (const loop of loops) {
    const start = points.length;
    rings.push({ start, count: loop.points.length });
    for (let index = 0; index < loop.points.length; ++index) {
      points.push(loop.points[index]!);
      sourceIndices.push(start + loop.sourceIndices[index]!);
    }
  }
  return {
    points,
    sourceIndices,
    rings,
    area: loops.reduce((total, loop) => total + signedArea(loop.points), 0),
  };
};
