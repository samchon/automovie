import type { IAutoMovieJointPose, IAutoMovieMotion, IAutoMoviePose } from "@automovie/interface";
import { createStickmanMotionJoint as j } from "./createStickmanMotionJoint";
import { createStickmanMotionPose as pose } from "./createStickmanMotionPose";
import { createStickmanMotionKeyframe as key } from "./createStickmanMotionKeyframe";

/**
 * Authored 0.9-second right-arm wave loop with three frames and a fixed opposite-arm stance. Forearm abduction alternates 28/-22/28 degrees while upper-arm abduction retains the existing 240-degree display overshoot. The page's axes/rest-frame and optional clamp decide playback; the values are choreography, not measured shoulder or elbow capability.
 *
 * @evidence contracts/common.md#principled-implementation A pose factory changes only the authored forearm axis around a shared stance joint, with equal first/last values and the existing easeInOut keys.
 * @evidence contracts/common.md#clear-and-simple-design The named wave producer supplies one current clip while the player owns interpolation, clinical constraint consumption and scene rendering.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The retained 240-degree angle is not hidden as a valid anatomical target, and no IK, collision or clinical admission is claimed.
 * @evidence contracts/common.md#meaningful-documentation The comment defines exact timing, varying forearm values, fixed upper-arm overshoot and optional playback qualification.
 * @evidence contracts/performance.md#efficient-algorithms Three fixed poses/keys and bounded joint lists give constant assembly cost; actual sampled articulation and rendering remain player/viewer work.
 * @evidence contracts/performance.md#reuse-equivalent-work The opposite-arm stance record is shared across this clip's frames; equal endpoint values are newly wrapped and there is no cross-call motion cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the clip and local arrays, which borrow the shared stance joint within this call; no running playback or renderer resource is retained by the producer.
 *
 * @author Samchon
 */
export const wave: (sk: string) => IAutoMovieMotion = (sk: string): IAutoMovieMotion => {
  const stanceArm: IAutoMovieJointPose = j("leftUpperArm", { abduction: 26 });
  const up: (fore: number) => IAutoMoviePose = (fore: number): IAutoMoviePose =>
    pose(sk, [
      stanceArm,
      j("rightUpperArm", { abduction: 240 }),
      j("rightLowerArm", { abduction: fore }),
      j("leftUpperLeg", { abduction: 6 }),
      j("rightUpperLeg", { abduction: -6 }),
    ]);
  return {
    id: "wave",
    skeleton: sk,
    duration: 0.9,
    loop: true,
    keyframes: [key(0, up(28)), key(0.45, up(-22)), key(0.9, up(28))],
  };
};
