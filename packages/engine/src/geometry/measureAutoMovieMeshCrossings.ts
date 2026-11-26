import type {
  IAutoMovieMesh,
  IAutoMovieMeshCrossing,
  IAutoMovieMeshCrossingOptions,
} from "@automovie/interface";

import { createAutoMovieMeshCrossingQuery } from "./createAutoMovieMeshCrossingQuery";

/**
 * Report every triangle of `first` that a triangle of `second` crosses.
 *
 * Both meshes share one metre frame and are only read. An entry names the
 * first-mesh triangle, one second-mesh witness, and whether the pair crosses
 * transversally or overlaps flat in one plane; it is empty when the surfaces
 * are disjoint or merely touch. Entries follow first-mesh ordinal, and the
 * witness is the first crossing candidate in the order
 * `collectAutoMovieSpatialQueryCandidates` gives: the first grid cell, at the
 * second mesh's mean triangle size, the pair shares in X, Y, Z order, then the
 * second ordinal. A transverse witness is preferred over a coplanar one. With
 * `allPairs` every crossing witness is reported instead, which a corrective
 * that must clear every contact needs; it then decides which shared vertices or
 * intended contacts are exempt.
 *
 * Touching is not crossing. Two shells meeting along a seam share vertices and
 * edges by construction, so every test is strict: a triangle edge pierces only
 * strictly inside both the edge and the other triangle, a segment ending at or
 * starting from the other triangle's corner is excluded by exact coordinate
 * identity before any arithmetic, and coplanar triangles overlap only through
 * properly crossing edges or strict containment. A fold through a shared corner
 * still reports, because its other edges cross. `interiorTolerance`, a
 * dimensionless margin in [0, 0.5) of the edge and triangle coordinates, lets a
 * caller classify sub-resolution seam residues as contact; omitted, it is zero.
 * `acceptTransversePoint` sees each strict transverse intersection point and
 * may reject it, which removes that one witness and continues with the other
 * edges and candidates; it cannot add a crossing the strict test did not find.
 *
 * The numerical cutoffs are classification thresholds, not proofs: a
 * Moller-Trumbore determinant below 1e-15 counts as parallel and is left to the
 * coplanar test, a face normal shorter than 1e-15 is never coplanar, and plane
 * distances below 1e-9 count as in-plane. This measures overlap only, not
 * depth, which `measureAutoMovieMeshClearance` gives along a chosen axis, nor
 * which surface should move. Passing one mesh as both arguments tests it for
 * self-intersection, as `measureAutoMovieModelCrossings` does with
 * `withinParts`. Throws on a malformed index buffer, a non-finite position or a
 * tolerance outside [0, 0.5).
 *
 * @param first Mesh whose triangles are reported.
 * @param second Mesh tested against it, in the same frame.
 * @param options Pair population, contact tolerance and point classifier.
 * @returns Crossings in first-triangle and candidate order.
 */
export function measureAutoMovieMeshCrossings(
  first: IAutoMovieMesh,
  second: IAutoMovieMesh,
  options?: IAutoMovieMeshCrossingOptions,
): IAutoMovieMeshCrossing[] {
  return createAutoMovieMeshCrossingQuery(second)(first, options);
}
