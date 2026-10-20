import type { IAutoMovieMotion, IAutoMoviePose } from "@automovie/interface";

import { createStickmanMotionJoint as j } from "./createStickmanMotionJoint";
import { createStickmanMotionKeyframe as key } from "./createStickmanMotionKeyframe";
import { createStickmanMotionPose as pose } from "./createStickmanMotionPose";

/**
 * Authored eight-second demonstration that one clinical value moves both sides alike: every pose gives the left and right joints the same angle. From the T-pose the elbows fold forward (flexion 90), the folded forearms pronate (twist 60), the upper arms rotate externally (twist 50, raising the folded forearms), the arms lower and the thighs rotate outward (twist 40) over bent knees (flexion 70), then abduct (25). Angles are degrees under the page's humanoid axes and rest frames.
 *
 * @evidence contracts/common.md#principled-implementation Each pose names its motion once and applies it to both sides through one helper, so a sign that differed between the sides would show as an asymmetric figure.
 * @evidence contracts/common.md#clear-and-simple-design A fixed producer of six poses and nine frames exposes the demonstration without owning playback, constraints or a solver.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The angles are authored display values inside the default humanoid ranges, not measurements; no contact or ROM validation occurs here.
 * @evidence contracts/common.md#meaningful-documentation The comment lists the motions in order with their angles and the axis and rest-frame interpretation.
 * @evidence contracts/performance.md#efficient-algorithms Six bounded joint arrays and nine frame wrappers require constant construction work.
 * @evidence contracts/performance.md#reuse-equivalent-work Held poses are shared by their consecutive frames within one call; each invocation creates a fresh clip.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Caller-owned clip wrappers retain their local pose arrays; no timer, player, worker or GPU handle is acquired.
 */
export const sides: (sk: string) => IAutoMovieMotion = (
  sk: string,
): IAutoMovieMotion => {
  const both = (
    bone: string,
    angles: { flexion?: number; abduction?: number; twist?: number },
  ): ReturnType<typeof j>[] =>
    (["left", "right"] as const).map(
      (side: "left" | "right"): ReturnType<typeof j> =>
        j(`${side}${bone}` as Parameters<typeof j>[0], angles),
    );
  const rest: IAutoMoviePose = pose(sk, []);
  const elbows: IAutoMoviePose = pose(sk, both("LowerArm", { flexion: 90 }));
  const pronate: IAutoMoviePose = pose(
    sk,
    both("LowerArm", { flexion: 90, twist: 60 }),
  );
  const external: IAutoMoviePose = pose(sk, [
    ...both("UpperArm", { twist: 50 }),
    ...both("LowerArm", { flexion: 90 }),
  ]);
  const thighs: IAutoMoviePose = pose(sk, [
    ...both("UpperArm", { abduction: 20 }),
    ...both("UpperLeg", { flexion: 20, twist: 40 }),
    ...both("LowerLeg", { flexion: 70 }),
  ]);
  const abduct: IAutoMoviePose = pose(sk, [
    ...both("UpperArm", { abduction: 20 }),
    ...both("UpperLeg", { abduction: 25 }),
  ]);
  return {
    id: "sides",
    skeleton: sk,
    duration: 8,
    loop: true,
    keyframes: [
      key(0, rest),
      key(1, elbows),
      key(2, pronate),
      key(3, external),
      key(4, external),
      key(5, thighs),
      key(6, thighs),
      key(7, abduct),
      key(8, rest),
    ],
  };
};
