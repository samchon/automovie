import type { IAutoMovieResolvedBone } from "@automovie/engine";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisDocument } from "../structures/IAutoMovieHumanBodyBasisDocument";
import type { resolveHumanBodySkeleton } from "./resolveHumanBodySkeleton";

/**
 * The prepared document-rig state `resolveHumanBodySourceReferenceGoals` reads.
 *
 * The shared document-rig owner supplies one shaped rig and its ordinary
 * pre-pelvis forward-kinematics result for the same document, so goal
 * conversion reads reference travel without building a second skeleton.
 * Every member is read only.
 *
 * @evidence contracts/common.md#principled-implementation The converter consumes the rig and FK result the caller already resolved for this document instead of re-deriving them.
 * @evidence contracts/common.md#clear-and-simple-design Four named members replace an anonymous parameter object.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries no cached angle or substitute reference.
 * @evidence contracts/common.md#meaningful-documentation States the producer, the shared-document precondition and read-only use.
 * @evidence contracts/modeling.md#spatial-conventions The baseline holds world rotations of the same shaped rig whose rest frames the converter removes.
 * @evidenceExclude contracts/modeling.md#parameter-channels The document's goals own the requested degrees.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Defines no tissue boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The builder and editor observe the converted pose.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The basis joints own the envelopes.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Internal resolution state, not an authored input.
 * @author Samchon
 */
export interface IHumanBodySourceReferenceGoalContext {
  /** Compiled basis whose joints declare each goal's source reference. */
  basis: IAutoMovieHumanBodyBasis;

  /** Admitted document carrying the thigh goals to convert. */
  document: IAutoMovieHumanBodyBasisDocument;

  /** Shaped rig of `document`: skeleton, rest rotations, axes and frames. */
  rig: ReturnType<typeof resolveHumanBodySkeleton>;

  /** Pre-pelvis forward-kinematics result of `rig` for the same document. */
  baseline: readonly IAutoMovieResolvedBone[];
}
