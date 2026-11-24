import { gaitMotion, validateMotion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieGait,
  IAutoMovieGaitLimb,
} from "@automovie/interface";
import { AutoMovieMotionHumanGait } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";

/**
 * The five public humanoid gait declarations produce admissible contralateral motion.
 *
 * Scenarios:
 * 1. Bake each declared gait once against a canonical rig; read its authored opposing phases and compare the three increasing locomotion amplitudes.
 *
 * @evidence contracts/development/testing.md#behavioral-verification The five public humanoid gait declarations produce admissible contralateral motion.
 * @evidence contracts/development/testing.md#independent-expectations A contralateral arm follows the opposite leg by definition; sprint has greater hip and knee swing than ordinary walking.
 * @evidence contracts/development/testing.md#distinguishing-cases A missing vocabulary row, phase reversal or an out-of-range angle has a different observation.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_gait_humanoid_gait_vocabulary(): void {
  const names = ["march", "run", "sneak", "sprint", "walk"] as const;
  TestValidator.equals(
    "public vocabulary",
    Object.keys(AutoMovieMotionHumanGait.HUMANOID_GAITS).sort((a, b) =>
      a.localeCompare(b, "en"),
    ),
    [...names],
  );
  const skeleton = motionHumanBody("m-average").skeleton;
  const limb = (
    gait: IAutoMovieGait,
    bone: AutoMovieHumanoidBone,
  ): IAutoMovieGaitLimb => gait.limbs.find((row) => row.bone === bone)!;
  for (const name of names) {
    const gait = AutoMovieMotionHumanGait.HUMANOID_GAITS[name];
    const clip = gaitMotion(name, skeleton.id, gait, 24);
    TestValidator.predicate(
      "bound gait and rig admission",
      gait.name === name && validateMotion({ motion: clip, skeleton }).success,
    );
    for (const [arm, leg] of [
      ["leftUpperArm", "rightUpperLeg"],
      ["rightUpperArm", "leftUpperLeg"],
    ] as const) {
      const swing = limb(gait, arm);
      TestValidator.predicate(
        "opposite arm phase",
        swing.amplitude > 0 && nclose(swing.phase, limb(gait, leg).phase),
      );
    }
  }
  const hip = (gait: IAutoMovieGait): number =>
    limb(gait, "leftUpperLeg").amplitude;
  TestValidator.predicate(
    "hip swing grows with speed",
    hip(AutoMovieMotionHumanGait.HUMANOID_GAITS.walk) <
      hip(AutoMovieMotionHumanGait.HUMANOID_GAITS.run) &&
      hip(AutoMovieMotionHumanGait.HUMANOID_GAITS.run) <
        hip(AutoMovieMotionHumanGait.HUMANOID_GAITS.sprint),
  );
  TestValidator.predicate(
    "largest sprint knee and slow sneak",
    names
      .filter((n) => n !== "sprint")
      .every(
        (n) =>
          limb(AutoMovieMotionHumanGait.HUMANOID_GAITS[n], "leftLowerLeg")
            .amplitude <
          limb(AutoMovieMotionHumanGait.HUMANOID_GAITS.sprint, "leftLowerLeg")
            .amplitude,
      ) &&
      AutoMovieMotionHumanGait.HUMANOID_GAITS.sneak.period >
        AutoMovieMotionHumanGait.HUMANOID_GAITS.walk.period,
  );
}
