import type { IAutoMovieMotion, IAutoMoviePose } from "@automovie/interface";
import { createStickmanMotionJoint as j } from "./createStickmanMotionJoint";
import { createStickmanMotionRoot as root } from "./createStickmanMotionRoot";
import { createStickmanMotionPose as pose } from "./createStickmanMotionPose";
import { createStickmanMotionKeyframe as key } from "./createStickmanMotionKeyframe";

/**
 * Authored 1.4-second three-key dance loop alternating signed torso twist, lateral root sway of 0.06 metres and yaw of 14 degrees. Alternating overhead arms retain the existing 210-degree abduction. These conventional display values are not clinically admitted movement; the page's optional clamp may change playback.
 *
 * @evidence contracts/common.md#principled-implementation A signed beat factory couples the explicitly authored torso/arm/root values, and equal -1 endpoint beats close the sparse cycle by value.
 * @evidence contracts/common.md#clear-and-simple-design One fixed beat recipe supplies current choreography without introducing a body optimizer or dance simulation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Coupled authored sway/twist is not inferred physiology, and the legacy overhead overshoot remains explicit rather than reported as valid shoulder capacity.
 * @evidence contracts/common.md#meaningful-documentation The comment states timing, metre/degree sway values and the preserved overshoot/optional clamp qualification.
 * @evidence contracts/performance.md#efficient-algorithms Three bounded pose/root/key constructions require constant work; engine sampling, FK and renderer cost remain with actual consumers.
 * @evidence contracts/performance.md#reuse-equivalent-work One beat formula governs both directions while calls create independent mutable records; no cached model or motion result crosses calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller retains this clip and its records for its player lifetime; no timer, worker or GPU resource is allocated by the producer.
 *
 * @author Samchon
 */
export const dance: (sk: string) => IAutoMovieMotion = (sk: string): IAutoMovieMotion => {
  const beat: (d: number) => IAutoMoviePose = (d: number): IAutoMoviePose =>
    pose(
      sk,
      [
        j("spine", { twist: 18 * d }),
        j("chest", { twist: 12 * d }),
        j("leftUpperArm", { abduction: d > 0 ? 210 : 120 }),
        j("rightUpperArm", { abduction: d > 0 ? 120 : 210 }),
        j("leftLowerLeg", { flexion: 14 }),
        j("rightLowerLeg", { flexion: 14 }),
      ],
      root(0.06 * d, 0, 0, 14 * d),
    );
  return {
    id: "dance",
    skeleton: sk,
    duration: 1.4,
    loop: true,
    keyframes: [key(0, beat(-1)), key(0.7, beat(1)), key(1.4, beat(-1))],
  };
};
