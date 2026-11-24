import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanStance } from "@automovie/motions";
import {
  AutoMovieMotionHumanArm,
  AutoMovieMotionHumanTarget,
  HumanHand,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/**
 * A fitted arm carries its palm to the same shoulder-relative landmark after the carrier translates and turns.
 *
 * Scenarios:
 * 1. Prepare one arm in the original stance and again after a rigid quarter turn and translation.
 * 2. At the held phase independently transform the desired palm site and compare with FK.
 *
 * @evidence contracts/development/testing.md#behavioral-verification A fitted arm carries its palm to the same shoulder-relative landmark after the carrier translates and turns.
 * @evidence contracts/development/testing.md#independent-expectations A positive 90-degree yaw maps (x,z) to (z,-x). The planner's 10 mm contact disk plus 1 mm FK allowance applies in either frame.
 * @evidence contracts/development/testing.md#distinguishing-cases Prepare one arm in the original stance and again after a rigid quarter turn and translation. At the held phase independently transform the desired palm site and compare with FK.
 * @evidence contracts/development/testing.md#execution-ownership Runs the named public operation in memory and samples its observable outputs.
 * @evidence contracts/development/common.md#meaningful-documentation States the phase, coordinate frame and quantitative basis of the check.
 */
export function test_motion_carry_person_primitive_arm_carry_carried(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  for (const yaw of [0, 90] as const) {
    const placement: IAutoMovieVector3 =
      yaw === 0 ? { x: 0, y: 0, z: 0 } : { x: 1, y: 0, z: 2 };
    const rest: IAutoMovieMotionHumanPosture =
      AutoMovieMotionHumanStance.stand.posture(body, placement, yaw);
    const expected: IAutoMovieVector3 =
      yaw === 0 ? { x: -0.2, y: 0.95, z: 0.4 } : { x: 1.4, y: 0.95, z: 2.2 };
    const goal: IAutoMovieHumanLimbGoal = AutoMovieMotionHumanArm.goal(
      body,
      "right",
      AutoMovieMotionHumanTarget.hand(
        body,
        rest,
        "right",
        { point: expected, normal: { x: 0, y: 1, z: 0 } },
        { bend: "front" },
      ),
    );
    const arm: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanArm.carried(
      {
        body,
        side: "right",
        from: 0,
        to: 2,
        rest: AutoMovieMotionHumanArm.angles(
          resolveHumanPosture(body, rest),
          "right",
        ),
        goal: () => goal,
        weight: (time: number): number => Math.min(1, time),
        span: { start: 0, ready: 1, relax: 2, end: 2 },
      },
    );
    const before = (): IAutoMovieMotionHumanPosture => rest;
    arm.prepare!(before);
    const solved: IAutoMovieMotionHumanPosture = arm.write(rest, 1.5, before);
    const palm: IAutoMovieVector3 = HumanHand.frame(
      body,
      poseBones(body, resolveHumanPosture(body, solved)),
      "right",
      "palm",
      "flat",
    ).point;
    TestValidator.predicate(
      `palm at yaw ${yaw} misses by ${Vector3.distance(palm, expected)} m`,
      Vector3.distance(palm, expected) <= 0.011,
    );
  }
}
