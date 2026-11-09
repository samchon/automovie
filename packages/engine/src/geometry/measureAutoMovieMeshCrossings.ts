import type { IAutoMovieMesh } from "@automovie/interface";

import type { IAutoMovieMeshCrossing } from "./IAutoMovieMeshCrossing";
import type { IAutoMovieMeshCrossingOptions } from "./IAutoMovieMeshCrossingOptions";
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
 * that must clear every contact needs; it then decides which shared vertices
 * or intended contacts are exempt.
 *
 * Touching is not crossing. Two shells meeting along a seam share vertices and
 * edges by construction, so every test is strict: a triangle edge pierces only
 * strictly inside both the edge and the other triangle, a segment ending at or
 * starting from the other triangle's corner is excluded by exact coordinate
 * identity before any arithmetic, and coplanar triangles overlap only through
 * properly crossing edges or strict containment. A fold through a shared
 * corner still reports, because its other edges cross. `interiorTolerance`, a
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
 * `withinParts`. Throws on a malformed index buffer, a non-finite position or
 * a tolerance outside [0, 0.5).
 *
 * @param first Mesh whose triangles are reported.
 * @param second Mesh tested against it, in the same frame.
 * @param options Pair population, contact tolerance and point classifier.
 * @returns Crossings in first-triangle and candidate order.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Two triangles cross transversally exactly when an edge of one pierces the other, which bounded Moller-Trumbore decides per edge, and coplanar triangles overlap exactly when their edges properly cross or one contains the other, decided in the plane of largest projected area; a median box hierarchy restricts each test to triangles whose boxes overlap.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The one-shot census delegates to createAutoMovieMeshCrossingQuery, which owns the sole narrow phase, immutable target index, witness selection and deterministic broad-phase ordering.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Shared corners are excluded by exact identity rather than by widening every bound, the tolerance and classifier are caller-declared and can only remove witnesses, and the three numerical cutoffs are named as classification limits rather than presented as proofs.
 * @evidence contracts/development/common.md#meaningful-documentation States the frame, what an entry means and when the result is empty, the ordering and witness rule, `allPairs`, the strict touching rule, both options' semantics, the numerical cutoffs, what it does not measure, the self-test use, and every refusal.
 * @evidence contracts/development/implementation.md#efficient-algorithms For f first and s second triangles, the second hierarchy costs O(s log^2 s) and each first triangle collects only candidates whose boxes overlap its own, sorting them in O(k log k), with a constant-time narrow phase per candidate; the default mode stops at the first transverse witness.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates all target preparation and census work to the reusable query owner. This convenience call prepares a fresh target snapshot; callers measuring against an unchanged resident surface retain createAutoMovieMeshCrossingQuery instead.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds both meshes' triangle records and the second hierarchy for the call and returns one record per crossing; the point classifier receives a fresh array per strict intersection only when supplied.
 */
export function measureAutoMovieMeshCrossings(
  first: IAutoMovieMesh,
  second: IAutoMovieMesh,
  options?: IAutoMovieMeshCrossingOptions,
): IAutoMovieMeshCrossing[] {
  return createAutoMovieMeshCrossingQuery(second)(first, options);
}
