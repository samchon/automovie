import { IAutoMovieProfilePoint } from "./IAutoMovieProfilePoint";
import { IAutoMovieRegionTriangulation } from "./IAutoMovieRegionTriangulation";
import { signedArea } from "./signedArea";

/** The triangles one already-validated region resolves to.
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Triangulates an already admitted region for real cap geometry.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Uses the canonical region identities for the cap indices consumed by extrusion and loft.
 */
export const trianglesOf = (
  region: Pick<IAutoMovieRegionTriangulation, "points" | "rings">,
): number[] => earClip(region.points, bridgeHoles(region.points, region.rings));

/**
 * Wind an already copied ring and its original local indices together. The
 * canonical owner offsets those indices by preceding input ring populations.
 *
 * Reversal maps corner `k` to corner `size - 1 - k`, which is a relabelling a
 * triangulation does not care about and a loft does: the loft refuses sections
 * whose rings disagree in winding, so every section is reversed or none is, and
 * corner `k` of one section still answers to corner `k` of the next.
 */
const orientedRing = (
  points: IAutoMovieProfilePoint[],
  counterClockwise: boolean,
) => {
  const sourceIndices = points.map((_point, index) => index);
  if (signedArea(points) > 0 !== counterClockwise) {
    points.reverse();
    sourceIndices.reverse();
  }
  return { points, sourceIndices };
};
