import {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMoviePose,
  IAutoMovieSkeleton,
} from "@automovie/interface";

import { IAutoMovieRecoilPush } from "../physics/IAutoMovieRecoilPush";
import { impactRecoil } from "../physics/impactRecoil";


/**
 * Bake a three-stop rest/flinch/rest reaction over positive seconds, using the impact recoil clamped to the supplied rig. Peak defaults to min(0.16, duration*0.4); neutral axes stay null even when a custom ROM excludes numeric zero.
 *
 * @evidence contracts/common.md#principled-implementation Uses impactRecoil's chain-propagated, ROM-clamped pose at peak and explicit neutral clinical joints at both endpoints; peak must lie strictly inside duration.
 * @evidence contracts/common.md#clear-and-simple-design The action helper owns reaction timing and keyframe easing, while impactRecoil owns impulse-to-joint propagation and rig limits.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid duration or peak throws; the short-clip peak fraction preserves valid quick reactions without injecting zero articulation into neutral endpoints.
 * @evidence contracts/common.md#meaningful-documentation States three-stop timing, default peak policy, rig clamping and null-neutral semantics.
 * @evidence contracts/performance.md#efficient-algorithms Creates three keyframes and O(chain length) neutral joints plus the delegated recoil calculation; no dense frame bake or repeated IK is needed.
 * @evidence contracts/performance.md#reuse-equivalent-work Both rest endpoints reuse one neutral pose; the recoil pose is computed once for the peak and no result is cached across changing rig or push inputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned keyframes own their wrappers and share the neutral pose at both ends; call-local recoil state is released and no simulation handle or ongoing task exists.
 */
export const reactMotion: (id: string, skeleton: IAutoMovieSkeleton, push: IAutoMovieRecoilPush, chain: AutoMovieHumanoidBone [ ], duration: number, peak?: number) => IAutoMovieMotion = (
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
  if (!Number.isFinite(duration))
    throw new Error("react duration must be finite and positive");
  if (duration <= 0)
    throw new Error("react duration must be finite and positive");
  if (!Number.isFinite(peak))
    throw new Error("react peak must be finite and within duration");
  if (peak <= 0)
    throw new Error("react peak must be finite and within duration");
  if (peak >= duration)
    throw new Error("react peak must be before react duration");

  const neutral: IAutoMovieJointPose[] = chain.map((bone: AutoMovieHumanoidBone): IAutoMovieJointPose => ({
    bone,
    flexion: null,
    abduction: null,
    twist: null,
  }));
  const rest: IAutoMoviePose = {
    skeleton: skeleton.id,
    root: null,
    joints: neutral,
  };
  const flinch: IAutoMoviePose = impactRecoil(push, chain, skeleton);
  const key: (time: number, pose: IAutoMoviePose, easing: IAutoMovieKeyframe [ "easing" ]) => IAutoMovieKeyframe = (
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
