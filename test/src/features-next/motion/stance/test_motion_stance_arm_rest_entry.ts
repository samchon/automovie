import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMoviePose,
} from "@automovie/interface";
import { HumanVerdicts } from "@automovie/motions";
import {
  AutoMovieMotionHumanAuditTangle,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { MOTION_HUMAN_LAW_STAGES_POSTURE } from "../../../features/internal/MOTION_HUMAN_LAW_STAGES_POSTURE";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionHumanLaw } from "../../../features/internal/motionHumanLaw";
import { motionHumanLawSweep } from "../../../features/internal/motionHumanLawSweep";
import { nclose } from "../../../features/internal/nclose";

/**
 * The resting arms and digits clear the torso and opposite hand while reaching their named support.
 *
 * Scenarios:
 * 1. Pose the original actor through the public action with its original seed and placement.
 * 2. Compare displayed arm and finger angles with the original authoring law at the start, interior and arrival.
 * 3. Compare the specified collision pair at its observed entry time against the 10 mm skin allowance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The table identifies the actor, action input, time and anatomical pair responsible for each observation.
 * @evidence contracts/development/testing.md#behavioral-verification Measures actual forward-kinematic shapes at the recorded instant. Unreachable paths must fail the test.
 * @evidence contracts/development/testing.md#independent-expectations The public skin allowance bounds physical collision. The authoring callback gives the reference angles independently of prepared display.
 * @evidence contracts/development/testing.md#distinguishing-cases Samples the original adverse geometry and the adjacent display frames to cover the rounded failure time.
 * @evidence contracts/development/testing.md#execution-ownership Each action is planned once, with four display parity checks and three displayed collision probes.
 */
export function test_motion_stance_arm_rest_entry(): void {
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
      const plan: IAutoMovieMotionHumanActionPlan =
        film.performance.segments("a")[0]!.plan;
      const arrival: number = motionHumanLaw.event(film, "placed");
      for (const t of [0, 0.137 * arrival, 0.583 * arrival, arrival]) {
        const native: IAutoMoviePose = resolveHumanPosture(
          body,
          plan.posture(t),
        );
        const displayed: IAutoMoviePose = film.performance.pose("a", t);
        for (const [i, joint] of native.joints.entries()) {
          if (
            !/^(left|right)(UpperArm|LowerArm|Hand|Thumb|Index|Middle|Ring|Little)/.test(
              joint.bone,
            )
          )
            continue;
          const actual: IAutoMoviePose["joints"][number] | undefined =
            displayed.joints[i];
          if (
            actual?.bone !== joint.bone ||
            !nclose(actual.flexion ?? 0, joint.flexion ?? 0, 1e-9) ||
            !nclose(actual.abduction ?? 0, joint.abduction ?? 0, 1e-9) ||
            !nclose(actual.twist ?? 0, joint.twist ?? 0, 1e-9)
          )
            findings.push(
              value + ": changed " + joint.bone + " at " + t + " s",
            );
        }
      }
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
