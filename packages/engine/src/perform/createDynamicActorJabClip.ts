import { IAutoMovieMotion, IAutoMoviePose } from "@automovie/interface";

import { ease } from "../motion/ease";
import { actorWeightedArmPose } from "./actorWeightedArmPose";
import { createDynamicActorPoseClip } from "./createDynamicActorPoseClip";

/**
 * Bake a moving strike goal with an easeIn envelope to the 40% peak and easeOut retraction over the remaining positive second duration. An unresolved target sample returns null.
 *
 * @evidence contracts/common.md#principled-implementation Pins the exact 40% landmark on the shared 24 Hz grid and scales each analytic arm pose by the outgoing or incoming envelope appropriate to that sample.
 * @evidence contracts/common.md#clear-and-simple-design Jab timing is separate from live target solving and the shared pose baker; static and moving strikes retain the same peak fraction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The 40% peak is fixed reference choreography, not a physical impulse model; sampled interpolation does not prove continuous contact or ROM safety.
 * @evidence contracts/common.md#meaningful-documentation States the 40% moving-goal peak, asymmetric easing, positive seconds, null failure and sampled contact limitations.
 * @evidence contracts/performance.md#efficient-algorithms For F samples, J solved joints and per-sample IK cost R, O(F log F + F R) time and O(F J) pose storage; the exact peak adds at most one sample.
 * @evidence contracts/performance.md#reuse-equivalent-work The peak is deduplicated before target sampling, and each solved pose feeds one scalar envelope application with no cross-action cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The invocation owns partial samples until success, null or throw; the caller owns a successful clip and no live target callback is retained.
 */
export const createDynamicActorJabClip: (props: {
  /** Caller-selected output motion identity. */ id: string;
  /** Skeleton id shared by every callback pose. */ skeleton: string;
  /** Finite strictly positive clip span in seconds. */ duration: number;
  /** Resolve an admitted clinical pose at local seconds; null refuses the complete bake and thrown errors propagate. */ poseAt: (
    time: number,
  ) => IAutoMoviePose | null;
}) => IAutoMovieMotion | null = (props: {
  /** Caller-selected output motion identity. */
  id: string;

  /** Skeleton id shared by every callback pose. */
  skeleton: string;

  /** Finite strictly positive clip span in seconds. */
  duration: number;

  /** Resolve an admitted clinical pose at local seconds; null refuses the complete bake and thrown errors propagate. */
  poseAt: (time: number) => IAutoMoviePose | null;
}): IAutoMovieMotion | null => {
  const peakAt: number = props.duration * 0.4;
  return createDynamicActorPoseClip({
    ...props,
    landmarks: [peakAt],
    poseAt: (time: number): IAutoMoviePose | null => {
      const pose: IAutoMoviePose | null = props.poseAt(time);
      if (pose === null) return null;
      const weight: number =
        time <= peakAt
          ? ease("easeIn", time / peakAt)
          : 1 - ease("easeOut", (time - peakAt) / (props.duration - peakAt));
      return actorWeightedArmPose(props.skeleton, pose, weight);
    },
  });
};
