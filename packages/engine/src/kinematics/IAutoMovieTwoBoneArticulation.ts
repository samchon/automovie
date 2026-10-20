import { IAutoMovieQuaternion } from "@automovie/interface";

/**
 * The two bone-local articulation deltas `twoBoneChainArticulation` produces.
 *
 * Apply `upper` on the chain-root joint and `lower` on the mid joint; each is
 * multiplied after the bone's rest rotation, as `resolvePose` composes
 * articulation. The caller lowers them into clinical angles with its own axes
 * and rest frames. `solvePreparedChainPlant`, which `fitChainToTarget` runs for
 * planted legs, applies it to hips and knees.
 *
 * @evidence contracts/common.md#principled-implementation Both deltas are bone-local, the root's obtained by conjugating the world delta with the rest world rotation and the mid joint's by aiming the far segment's local direction at the local goal, so applying them through forward kinematics lands the end effector on the solved point.
 * @evidence contracts/common.md#clear-and-simple-design Quaternions rather than clinical angles, because the axis convention and rest frames belong to the caller and the solver stays geometry only.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither delta is clamped to a range of motion here; a caller that must respect a hinge passes its axis as the bend plane instead of correcting the result afterwards.
 * @evidence contracts/common.md#meaningful-documentation States the producer, which joint takes which delta, the composition order with the rest rotation, who lowers them into angles, and the consumers.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data record; the constant-time solve is answered on `twoBoneChainArticulation`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One pair of deltas per planted chain and frame, each for a different target, so there is nothing to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Two quaternions, released with the caller's pose.
 */
export interface IAutoMovieTwoBoneArticulation {
  /** Bone-local articulation delta for the chain-root joint, such as a hip or shoulder. */
  upper: IAutoMovieQuaternion;

  /** Bone-local articulation delta for the mid joint, such as a knee or elbow. */
  lower: IAutoMovieQuaternion;
}
