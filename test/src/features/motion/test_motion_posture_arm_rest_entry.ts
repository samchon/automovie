import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditTangle,
  HumanVerdicts,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { MOTION_HUMAN_LAW_STAGES_POSTURE } from "../internal/MOTION_HUMAN_LAW_STAGES_POSTURE";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanLaw } from "../internal/motionHumanLaw";
import { motionHumanLawSweep } from "../internal/motionHumanLawSweep";

/**
 * The resting arms and digits clear the torso and opposite hand while reaching their named support.
 *
 * Scenarios:
 * 1. Pose the original actor through the public action with its original seed and placement.
 * 2. Compare the specified collision pair at its observed entry time against the 10 mm skin allowance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The table identifies the actor, action input, time and anatomical pair responsible for each observation.
 * @evidence contracts/development/testing.md#behavioral-verification Measures actual forward-kinematic shapes at the recorded instant. Unreachable paths must fail the test.
 * @evidence contracts/development/testing.md#independent-expectations The bound is the public skin allowance, independent of the limb planner's selected goal.
 * @evidence contracts/development/testing.md#distinguishing-cases Samples the original adverse geometry and the adjacent display frames to cover the rounded failure time.
 * @evidence contracts/development/testing.md#execution-ownership Each distinct action input is planned once and assessed at three local instants.
 */
export function test_motion_posture_arm_rest_entry(): void {
  const findings: string[] = [];
  for (const [value, name, seconds, first, second] of [
    ["pocket", "m-large", 0.33, "rightHand", "hips"],
    ["hip", "f-small", 0.29, "leftHand", "hips"],
    ["crossed", "m-large", 0.63, "rightLowerArm", "leftLowerArm"],
    ["claspedBehind", "m-large", 0.33, "leftIndexDistal", "hips"],
    ["behindHead", "f-small", 0.71, "leftIndexProximal", "rightHand"],
  ] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const stage: motionHumanLawSweep.IScene =
      MOTION_HUMAN_LAW_STAGES_POSTURE.rest!(
        (key) => (key === "place" ? value : undefined),
        body,
        body,
      );
    try {
      const film: motionHumanLaw.IFilm = motionHumanLawSweep.perform(
        "sweep-1",
        stage,
      );
      for (const t of [seconds - 1 / 24, seconds, seconds + 1 / 24]) {
        const contacts = AutoMovieMotionHumanAuditTangle.pose(
          body,
          film.bones("a", t),
        );
        const pair = contacts.find(
          ({ a, b }) =>
            (a === first && b === second) || (a === second && b === first),
        );
        if (pair && pair.depth > HumanVerdicts.SKIN)
          findings.push(
            value +
              ": " +
              first +
              "/" +
              second +
              " overlap " +
              pair.depth +
              " m at " +
              t +
              " s",
          );
      }
    } catch (error) {
      findings.push(value + ": " + String(error));
    }
  }
  TestValidator.equals("admission and posed skin clearance", findings, []);
}
