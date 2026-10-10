import type { IAutoMovieResolvedBone } from "@automovie/engine";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanBodySkeletonRig } from "../structures/rig/IAutoMovieHumanBodySkeletonRig";

/**
 * The prepared document-rig state `resolveHumanBodySourceReferenceGoals` reads.
 *
 * The shared document-rig owner supplies one shaped rig and its ordinary
 * pre-pelvis forward-kinematics result for the same document, so goal
 * conversion reads reference travel without building a second skeleton.
 * Every member is read only.
 *
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
