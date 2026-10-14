import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A point whose free distance to the closed collider was actually measured.
 *
 * Distance to a closed set is 1-Lipschitz, so `humanFaceHairFreeDistanceBound` can prove a nearby candidate free without another query on the same surface. The contact projector copies its latest witness point; the ribbon mesher borrows a station from its input curve for the current call. Those borrowed coordinates must remain unchanged while the witness is used.
 *
 * @evidence contracts/common.md#principled-implementation An actually measured signed-distance witness supports a closed-set lower bound; an unqueried candidate is never relabeled as a measured hit.
 * @evidence contracts/common.md#clear-and-simple-design Point and free distance form the minimal witness used separately by the contact projector and ribbon mesher.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Each witness belongs to its current collider; the projector copies its point but the mesher borrows an input station, so unchanged curve coordinates during meshing remain a premise.
 * @evidence contracts/common.md#meaningful-documentation The prose gives the same-surface 1-Lipschitz premise, measured distance, projector-owned point and mesher-borrowed station lifetime.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The witness record computes no proof; humanFaceHairFreeDistanceBound owns the constant-size candidate comparison.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Nearby candidates may reuse this measured distance only under the same closed collider, as the owning contact or mesher establishes.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Each keeper retains one latest point/distance pair and replaces it rather than accumulating samples.
 *
 * @author Samchon
 */
export interface IHumanFaceHairFreeWitness {
  /** Sampled point: copied by the projector or borrowed from the mesher's unchanged input curve. */
  point: IAutoMovieVector3;

  /** Its measured signed free distance, in metres. */
  free: number;
}
