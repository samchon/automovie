import { IAutoMovieResolvedBone } from "../kinematics/IAutoMovieResolvedBone";

/**
 * One evaluated actor's resolved bone frames at an absolute soft step.
 *
 * @evidence contracts/common.md#principled-implementation Actor identity and resolved bone frames let the wearable resolver derive bone-local anchors and body-capsule endpoints from the same primary-motion snapshot.
 * @evidence contracts/common.md#clear-and-simple-design Existing IAutoMovieResolvedBone frames are reused instead of a soft-specific skeleton or duplicate forward-kinematics representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The resolver requires each cited bone to resolve uniquely; this row provides no fallback pose for an absent actor or bone.
 * @evidence contracts/common.md#meaningful-documentation States actor identity, fixed-step sampling and the resolved rather than authored nature of the supplied bones.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This snapshot contains no kinematic walk; bone resolution and subsequent target lookup are costed on their callers.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Several anchors/capsules may read the same immutable snapshot, but this data record schedules no duplicated actor evaluation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The supplying snapshot owns its readonly bone array and nested frames, with no reference to an animation host or rendered actor.
 */
export interface IAutoMovieWearableSoftActorPose {
  /** Stable actor participant identity. */
  actor: string;

  /** Resolved humanoid bones at this boundary. */
  bones: readonly IAutoMovieResolvedBone[];
}
