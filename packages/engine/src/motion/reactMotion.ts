import {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMoviePose,
  type IAutoMovieRecoilPush,
  IAutoMovieSkeleton,
} from "@automovie/interface";

import { impactRecoil } from "../physics/impactRecoil";

/**
 * Bake a three-stop rest/flinch/rest reaction over positive seconds, using the
 * impact recoil clamped to the supplied rig. Peak defaults to min(0.16,
 * duration*0.4); neutral axes stay null even when a custom ROM excludes numeric
 * zero.
 */
export const reactMotion: (
  id: string,
  skeleton: IAutoMovieSkeleton,
  push: IAutoMovieRecoilPush,
  chain: AutoMovieHumanoidBone[],
  duration: number,
  peak?: number,
) => IAutoMovieMotion = (
  id: string,
  skeleton: IAutoMovieSkeleton,
  push: IAutoMovieRecoilPush,
  chain: AutoMovieHumanoidBone[],
  duration: number,
  // The default peak scales down for a quick flinch: a fixed 0.16 s would
  // reject every legitimate sub-0.16 s duration outright (peak >= duration),
  // while durations >= 0.4 s keep the exact 0.16 s snap.
  peak: number = Math.min(0.16, duration * 0.4),
): IAutoMovieMotion => {
  if (duration <= 0)
    throw new Error("react duration must be finite and positive");
  if (peak <= 0)
    throw new Error("react peak must be finite and within duration");
  if (peak >= duration)
    throw new Error("react peak must be before react duration");

  const neutral: IAutoMovieJointPose[] = chain.map(
    (bone: AutoMovieHumanoidBone): IAutoMovieJointPose => ({
      bone,
      flexion: null,
      abduction: null,
      twist: null,
    }),
  );
  const rest: IAutoMoviePose = {
    skeleton: skeleton.id,
    root: null,
    joints: neutral,
  };
  const flinch: IAutoMoviePose = impactRecoil(push, chain, skeleton);
  const key: (
    time: number,
    pose: IAutoMoviePose,
    easing: IAutoMovieKeyframe["easing"],
  ) => IAutoMovieKeyframe = (
    time: number,
    pose: IAutoMoviePose,
    easing: IAutoMovieKeyframe["easing"],
  ): IAutoMovieKeyframe => ({
    time,
    pose,
    expression: null,
    easing,
    bezier: null,
  });
  return {
    id,
    skeleton: skeleton.id,
    duration,
    loop: false,
    keyframes: [
      key(0, rest, "easeOut"),
      key(peak, flinch, "easeOut"),
      key(duration, rest, "easeInOut"),
    ],
  };
};
