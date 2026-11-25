import type {
  IAutoMovieMotionHumanArmAngles,
  IAutoMoviePose,
} from "@automovie/interface";
import { AutoMovieMotionHumanArmAngles } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { joint } from "../../../internal/joint";
import { makePose } from "../../../internal/makePose";

/**
 * `AutoMovieMotionHumanArmAngles.angles` reads one arm's joint angles off a
 * solved pose: the upper arm, forearm and hand by their first records, an
 * absent angle or joint as zero, and every finger joint of that side.
 *
 * Scenarios, a pose with both arms' records:
 *
 * 1. The left arm's three joints, the hand's missing twist as 0, its fingers but
 *    not the right's, a repeated forearm record ignored.
 * 2. The right arm with no hand record reads the hand as zeros.
 */
export function test_unit_motions_compose_arm_angles(): void {
  const pose: IAutoMoviePose = makePose([
    joint("leftUpperArm", { flexion: 30, abduction: 10, twist: 5 }),
    joint("leftLowerArm", { flexion: 90 }),
    joint("leftLowerArm", { flexion: 10 }),
    joint("leftHand", { flexion: 20, abduction: -5 }),
    joint("leftIndexProximal", { flexion: 15 }),
    joint("rightIndexProximal", { flexion: 40 }),
    joint("rightUpperArm", { abduction: 60 }),
  ]);

  // 1. The left arm.
  TestValidator.equals(
    "the left arm's angles",
    AutoMovieMotionHumanArmAngles.angles(pose, "left"),
    {
      upper: [30, 10, 5],
      lower: [90, 0, 0],
      hand: [20, -5, 0],
      fingers: { leftIndexProximal: [15, 0, 0] },
    } satisfies IAutoMovieMotionHumanArmAngles.IAngles,
  );

  // 2. The right arm.
  TestValidator.equals(
    "the right arm's angles",
    AutoMovieMotionHumanArmAngles.angles(pose, "right"),
    {
      upper: [0, 60, 0],
      lower: [0, 0, 0],
      hand: [0, 0, 0],
      fingers: { rightIndexProximal: [40, 0, 0] },
    } satisfies IAutoMovieMotionHumanArmAngles.IAngles,
  );
}
