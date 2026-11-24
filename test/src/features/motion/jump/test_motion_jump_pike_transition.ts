import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieQuaternion,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanJump,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../internal/motionHumanBody";

/**
 * The displayed pike passes continuously through the former one-radian jump.
 *
 * Scenarios:
 *
 * 1. Read both legs of the small gymnast immediately across the recorded
 *    forward-somersault transition.
 *
 * @evidence contracts/development/testing.md#behavioral-verification The displayed pike passes continuously through the former one-radian jump.
 * @evidence contracts/development/testing.md#independent-expectations For a differentiable orientation curve the geodesic increment shrinks with the time bracket and neighbouring angular rates approach one another.
 * @evidence contracts/development/testing.md#distinguishing-cases The half-width and quarter-width observations distinguish a jump from a finite rate.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_jump_pike_transition(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("f-small");
  const film: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed: "airborne",
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a")
      .stand({ hold: 0.3 })
      .jump(
        {
          to: { x: 0, y: 0, z: 1 },
          apex: 0.6,
          rotation: { somersault: 1, way: "forward" },
        },
        "leap",
      ).node,
    layers: {
      a: [
        {
          layer: AutoMovieMotionHumanJump.HumanAirborneShape.layer("pike"),
          from: { of: "leap", event: "takeoff" },
          to: { of: "leap", event: "touchdown" },
          fade: 0.05,
        },
      ],
    },
  });
  const at: number = 0.6237281336382425;
  const separation = (
    a: IAutoMovieQuaternion,
    b: IAutoMovieQuaternion,
  ): number => {
    const dot: number = Math.abs(a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w);
    return 2 * Math.acos(Math.min(1, dot));
  };
  for (const bone of [
    "leftUpperLeg",
    "rightUpperLeg",
    "leftLowerLeg",
    "rightLowerLeg",
  ] as const) {
    const rotation = (
      seconds: number,
      b: AutoMovieHumanoidBone,
    ): IAutoMovieQuaternion => film.bones("a", seconds).get(b)!.worldRotation;
    const h: number = 1 / 2400;
    const before = rotation(at - h, bone),
      after = rotation(at + h, bone);
    const outer: number = separation(before, after);
    const inner: number = separation(
      rotation(at - h / 2, bone),
      rotation(at + h / 2, bone),
    );
    TestValidator.predicate(
      "increment contracts through pike boundary",
      inner <= 0.75 * outer + 1e-6 && outer < 0.17277368511627203,
    );
  }
}
