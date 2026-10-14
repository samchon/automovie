import { IAutoMovieMotion, IAutoMoviePose } from "@automovie/interface";

import { ease } from "../motion/ease";
import { actorWeightedArmPose } from "./actorWeightedArmPose";
import { createDynamicActorPoseClip } from "./createDynamicActorPoseClip";

/**
 * Bake a moving arm goal with an easeInOut extension over the first half of a positive second duration, then hold its sampled solved articulation. An unresolved target sample returns null.
 *
 * @evidence contracts/common.md#principled-implementation Adds the exact halfway landmark to the shared 24 Hz bake and applies the same scalar envelope as the static three-frame extension; target geometry is solved by the supplied callback at each time.
 * @evidence contracts/common.md#clear-and-simple-design The extension envelope owns only its half-span law; shared sampling and numeric arm weighting own their respective operations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This sampled tracking approximates inter-key motion and does not guarantee continuous contact or ROM validity; callback errors propagate.
 * @evidence contracts/common.md#meaningful-documentation States moving-goal sampling, the halfway hold law, positive seconds, null failure and sampled contact limitations.
 * @evidence contracts/performance.md#efficient-algorithms For F samples and per-sample IK cost R, O(F log F + F R) time and O(F J) pose storage through the shared baker, with J solved joints.
 * @evidence contracts/performance.md#reuse-equivalent-work The single halfway landmark is deduplicated with the regular grid, and each callback result is used once for weighting.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns a successful clip; invocation-local partial poses are released on null/throw and no callback or task is retained beyond the clip construction.
 */
export const createDynamicActorExtendClip: (props: {
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
  const extendedAt: number = props.duration * 0.5;
  return createDynamicActorPoseClip({
    ...props,
    landmarks: [extendedAt],
    poseAt: (time: number): IAutoMoviePose | null => {
      const pose: IAutoMoviePose | null = props.poseAt(time);
      if (pose === null) return null;
      const weight: number =
        time >= extendedAt ? 1 : ease("easeInOut", time / extendedAt);
      return actorWeightedArmPose(props.skeleton, pose, weight);
    },
  });
};
