import { IAutoMovieKeyframe, IAutoMovieMotion, IAutoMoviePose } from "@automovie/interface";

const BONE_TARGET_HZ: number = 24 as const;

const boneTargetTimes: (duration: number, landmarks?: readonly number [ ]) => number [ ] = (
  duration: number,
  landmarks: readonly number[] = [],
): number[] => {
  const count: number = Math.max(2, Math.ceil(duration * BONE_TARGET_HZ) + 1);
  return [
    ...new Set([
      ...Array.from(
        { length: count },
        (_: unknown, index: number) : number => (duration * index) / (count - 1),
      ),
      ...landmarks,
    ]),
  ].sort((a: number, b: number) : number => a - b);
};

/**
 * Bake a live pose callback at 24 Hz plus exact caller landmarks over a positive second duration. Return null if any callback sample cannot resolve; successful samples form a non-looping linear clinical-pose clip.
 *
 * @evidence contracts/common.md#principled-implementation Uses an endpoint-inclusive grid with at least two samples, deduplicates and sorts landmark times, then samples each instant once; admitted finite duration and in-span landmarks come from the reference synthesis envelopes.
 * @evidence contracts/common.md#clear-and-simple-design One sampling primitive serves animated gaze, extension and jab envelopes so their null propagation and keyframe timing agree.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The 24 Hz bake is an approximation between samples and does not prove continuous contact or ROM safety; a callback exception propagates rather than producing a partial clip.
 * @evidence contracts/common.md#meaningful-documentation States 24 Hz, exact landmarks, linear output, whole-clip null refusal, propagated callback errors and inter-key approximation.
 * @evidence contracts/performance.md#efficient-algorithms For F grid plus landmark instants, sorting costs O(F log F), callback cost is summed once per distinct instant, and storage is O(F) plus the returned poses.
 * @evidence contracts/performance.md#reuse-equivalent-work Duplicate landmarks are collapsed before callback evaluation; no cache spans actions because live target and actor-frame callbacks may depend on different shot times.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The invocation owns the grid and keyframes, releases partial output on null/throw, and returns successful callback poses by reference; no external handle or task is retained.
 */
export const createDynamicActorPoseClip: (props: { /** Caller-selected output motion identity. */ id : string ; /** Skeleton id shared by every callback pose. */ skeleton : string ; /** Finite strictly positive clip span in seconds. */ duration : number ; /** Resolve an admitted clinical pose at local seconds; null refuses the complete bake and thrown errors propagate. */ poseAt : ( time : number ) => IAutoMoviePose | null ; /** Additional finite in-span seconds that must be sampled exactly; duplicates collapse with the regular grid. */ landmarks ? : readonly number [ ] ; }) => IAutoMovieMotion | null = (props: {
  /** Caller-selected output motion identity. */
  id: string;

  /** Skeleton id shared by every callback pose. */
  skeleton: string;

  /** Finite strictly positive clip span in seconds. */
  duration: number;

  /** Resolve an admitted clinical pose at local seconds; null refuses the complete bake and thrown errors propagate. */
  poseAt: (time: number) => IAutoMoviePose | null;

  /** Additional finite in-span seconds that must be sampled exactly; duplicates collapse with the regular grid. */
  landmarks?: readonly number[];
}): IAutoMovieMotion | null => {
  const keyframes: IAutoMovieKeyframe[] = [];
  for (const time of boneTargetTimes(props.duration, props.landmarks)) {
    const pose: IAutoMoviePose | null = props.poseAt(time);
    if (pose === null) return null;
    keyframes.push({
      time,
      pose,
      expression: null,
      easing: "linear",
      bezier: null,
    });
  }
  return {
    id: props.id,
    skeleton: props.skeleton,
    duration: props.duration,
    loop: false,
    keyframes,
  };
};
