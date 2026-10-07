import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IAutoMovieHumanBodyBoneWorldRest } from "../../structures/rig/IAutoMovieHumanBodyBoneWorldRest";

/**
 * Offline reference placement of an atlas surface against one body shape.
 *
 * The compiler registers the mesh into common body metres and records the
 * carrying rig frame on that exact shape. Runtime only carries it rigidly;
 * an authored placement does not establish imaged articular centres, fitted
 * tissue contact or person-specific anatomy.
 *
 * @evidence contracts/common.md#principled-implementation Exact reference shape and carrying frame bound the rigid replay; a different shape is refused instead of silently scaling anatomy.
 * @evidence contracts/common.md#clear-and-simple-design Registration keeps the placement account with its frame and shape.
 * @evidenceExclude contracts/common.md#prohibited-implementation-shortcuts This record transports offline registration.
 * @evidence contracts/common.md#meaningful-documentation States registration authority and its unsupported physiological conclusions.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The resource owns part identity.
 * @evidence contracts/modeling.md#parameter-channels Shape is an exact replay condition, not an atlas deformation channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry No geometry emitted.
 * @evidence contracts/modeling.md#spatial-conventions The reference carrying frame is right-handed Y-up, anatomical-left +X, +Z forward metres and a unit quaternion.
 * @evidence contracts/modeling.md#shared-boundaries Reference placement constructs no bone-to-skin or interosseous tissue join.
 * @evidenceExclude contracts/modeling.md#rendered-observation The atlas model adapter observes placement.
 * @evidence contracts/anatomy.md#anatomical-source The registration account distinguishes authored correspondence from independently imaged landmarks.
 * @evidenceExclude contracts/anatomy.md#permitted-range No clinical range is asserted.
 * @evidenceExclude contracts/anatomy.md#parametric-authority This is compiled source data, never a person-authored frame.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyAtlasRegistration {
  /** Exact compiled body basis revision; copied stale resources refuse. */
  basis: string;

  /** Humanoid carrier; separate anatomical joints require another rig owner. */
  bone: AutoMovieHumanoidBone;

  /** Carrying frame against which the registered mesh was authored. */
  reference: IAutoMovieHumanBodyBoneWorldRest;

  /** Exact basis weights; omission of a channel means zero. */
  shape: Record<string, number>;

  /** Named paired references, conversions and unresolved registration limits. */
  protocol: string;

  /** Authored reference placement supplies no personal tissue registration. */
  qualification: "authored-reference-only";
}
