import { IAutoMovieResolvedBone } from "../kinematics/IAutoMovieResolvedBone";

/**
 * One evaluated actor's resolved bone frames at an absolute soft step.
 *
 * @evidence contracts/development/design.md#principled-representation Actor identity and resolved bone frames let the wearable resolver derive bone-local anchors and body-capsule endpoints from the same primary-motion snapshot.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Existing IAutoMovieResolvedBone frames are reused instead of a soft-specific skeleton or duplicate forward-kinematics representation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The resolver requires each cited bone to resolve uniquely; this row provides no fallback pose for an absent actor or bone.
 * @evidence contracts/development/common.md#meaningful-documentation States actor identity, fixed-step sampling and the resolved rather than authored nature of the supplied bones.
 */
export interface IAutoMovieWearableSoftActorPose {
  /** Stable actor participant identity. */
  actor: string;

  /** Resolved humanoid bones at this boundary. */
  bones: readonly IAutoMovieResolvedBone[];
}
