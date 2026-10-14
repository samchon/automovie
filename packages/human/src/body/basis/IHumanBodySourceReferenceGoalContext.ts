import type { IAutoMovieResolvedBone } from "@automovie/engine";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanBodySkeletonRig } from "../structures/rig/IAutoMovieHumanBodySkeletonRig";

/**
 * The prepared document-rig state `resolveHumanBodySourceReferenceGoals` reads.
 *
 * The shared document-rig owner supplies one shaped rig and its ordinary pre-pelvis forward-kinematics result for the same document, so goal conversion reads reference travel without building a second skeleton. Every member is read only.
 *
 * @evidence contracts/common.md#principled-implementation One admitted document's shaped rig and matching pre-pelvis FK baseline preserve the reference travel used by source-goal conversion.
 * @evidence contracts/common.md#clear-and-simple-design The shared document-rig owner provides the conversion context so no second skeleton is reconstructed by the goal reader.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A baseline from another shape or post-pelvis phase cannot stand in for this document's prepared reference frames.
 * @evidence contracts/common.md#meaningful-documentation Members identify exact compiled reference, admitted thigh goals, shaped frame data and pre-pelvis baseline ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Source-goal context typing performs no reference conversion or forward kinematics.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shared rig/baseline provenance is declared here while the document-rig owner controls completed-state reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This borrowed context acquires no second skeleton, FK cache or ongoing goal-conversion task.
 * @author Samchon
 */
export interface IHumanBodySourceReferenceGoalContext {
  /** Compiled basis whose joints declare each goal's source reference. */
  basis: IAutoMovieHumanBodyBasis;

  /** Admitted document carrying the thigh goals to convert. */
  document: IAutoMovieHumanBodyBasisDocument;

  /** Shaped rig of `document`: skeleton, rest rotations, axes and frames. */
  rig: IAutoMovieHumanBodySkeletonRig;

  /** Pre-pelvis forward-kinematics result of `rig` for the same document. */
  baseline: readonly IAutoMovieResolvedBone[];
}
