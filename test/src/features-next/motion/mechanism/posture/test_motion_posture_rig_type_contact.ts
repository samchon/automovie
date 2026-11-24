import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { HumanVerdicts } from "@automovie/motions";
import { AutoMovieMotionHumanAuditTangle } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { MOTION_HUMAN_LAW_STAGES_POSTURE } from "../../../../features/internal/MOTION_HUMAN_LAW_STAGES_POSTURE";
import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { motionHumanLaw } from "../../../../features/internal/motionHumanLaw";
import { motionHumanLawSweep } from "../../../../features/internal/motionHumanLawSweep";

/**
 * The left forearm clears the spine as the small actor types on the real keyboard.
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
export function test_motion_posture_rig_type_contact(): void {
  const findings: string[] = [];
  for (const [value, name, seconds, first, second] of [
    ["default", "f-small", 2.33, "leftLowerArm", "spine"],
  ] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const stage: motionHumanLawSweep.IScene =
      MOTION_HUMAN_LAW_STAGES_POSTURE.typeText!(
        (key) => (key === "kind" ? value : undefined),
        body,
        body,
      );
    try {
      const film: motionHumanLaw.IFilm = motionHumanLawSweep.perform(
        "sweep-1",
        stage,
      );
      const action = film.performance
        .segments("a")
        .find((segment) => segment.name === "typeText")!;
      const presses = action.plan.events.filter((event) =>
        /^press\d+$/.test(event.name),
      );
      TestValidator.equals(
        "one successive press per character",
        presses.map((event) => event.name),
        Array.from("hello world", (_, index) => "press" + (index + 1)),
      );
      TestValidator.predicate(
        "positive time between consecutive presses",
        presses.every(
          (event, index) =>
            index === 0 || event.share > presses[index - 1]!.share,
        ),
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
