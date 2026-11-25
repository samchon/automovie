import {
  type IAutoMovieCreateDynamicActorPoseClip,
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMoviePose,
} from "@automovie/interface";

const BONE_TARGET_HZ: number = 24 as const;

const boneTargetTimes: (
  duration: number,
  landmarks?: readonly number[],
) => number[] = (
  duration: number,
  landmarks: readonly number[] = [],
): number[] => {
  const count: number = Math.max(2, Math.ceil(duration * BONE_TARGET_HZ) + 1);
  return [
    ...new Set([
      ...Array.from(
        { length: count },
        (_: unknown, index: number): number => (duration * index) / (count - 1),
      ),
      ...landmarks,
    ]),
  ].sort((a: number, b: number): number => a - b);
};

/**
 * Bake a live pose callback at 24 Hz plus exact caller landmarks over a
 * positive second duration. Return null if any callback sample cannot resolve;
 * successful samples form a non-looping linear clinical-pose clip.
 */
export const createDynamicActorPoseClip: (
  props: IAutoMovieCreateDynamicActorPoseClip.IProps,
) => IAutoMovieMotion | null = (
  props: IAutoMovieCreateDynamicActorPoseClip.IProps,
): IAutoMovieMotion | null => {
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
