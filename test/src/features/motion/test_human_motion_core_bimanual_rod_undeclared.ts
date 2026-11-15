import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionHumanArm,
  AutoMovieMotionHumanTarget,
  HumanHand,
  HumanRefusal,
  type IAutoMovieMotionHumanPrimitive,
  type IHumanBody,
  type IHumanPosture,
  resolveHumanPosture,
  stand,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Two hands that meet on one rod with no grasp declared are two colliding
 * arms: the planner refuses them, which is what the declared grasp of
 * `test_human_motion_core_bimanual_rod` excuses.
 *
 * Scenario: the average man's palms are laid side by side, 6 cm apart, on a
 * rod held across his body ahead at waist height, from the quiet stance over
 * 0.6 s, the rod lifted 0.15 m between 0.65 s and 1.05 s and let go by
 * 1.5 s, each hand held to a 4 mm disc about its grip, and neither arm
 * declares a grasp (`ICarry.grasp`): planning the pair throws a
 * `HumanRefusal`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Plans two real carried arms; a pair of hands that meet with no declared grasp passing as clear fails.
 * @evidence contracts/development/testing.md#independent-expectations The rod, its lift and the hands' places are written here, the same as the declared case's.
 * @evidence contracts/development/testing.md#distinguishing-cases The undeclared half of the pair whose declared half is `test_human_motion_core_bimanual_rod`, apart so each runs alone within its bound.
 * @evidence contracts/development/testing.md#execution-ownership An in-memory unit on one prepared body; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the scenario and its expectation.
 */
export function test_human_motion_core_bimanual_rod_undeclared(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const quiet: IHumanPosture = stand.posture(body, { x: 0, y: 0, z: 0 }, 0);
  const span = { start: 0, ready: 0.6, relax: 1.1, end: 1.5 };
  const lift = (seconds: number): number => {
    const s: number = Math.min(1, Math.max(0, (seconds - 0.65) / 0.4));
    return 0.15 * s * s * s * (10 - 15 * s + 6 * s * s);
  };
  const place = (side: HumanHand.Side, seconds: number): IAutoMovieVector3 => ({
    x: side === "left" ? 0.03 : -0.03,
    y: 1.0 + lift(seconds),
    z: 0.35,
  });
  const together = AutoMovieMotionHumanArm.together();
  const arms: IAutoMovieMotionHumanPrimitive[] = (
    ["right", "left"] as const
  ).map(
    (side: HumanHand.Side): IAutoMovieMotionHumanPrimitive =>
      AutoMovieMotionHumanArm.carried({
        body,
        side,
        from: span.start,
        to: span.end,
        rest: AutoMovieMotionHumanArm.angles(
          resolveHumanPosture(body, quiet),
          side,
        ),
        goal: (_: IHumanPosture, seconds: number): IHumanPosture.IGoal =>
          AutoMovieMotionHumanArm.goal(
            body,
            side,
            AutoMovieMotionHumanTarget.hand(
              body,
              quiet,
              side,
              { point: place(side, seconds), normal: { x: 0, y: 1, z: 0 } },
              { forward: { x: 0, y: 0, z: 1 } },
            ),
          ),
        weight: (): number => 0,
        span,
        together,
        disc: 0.004,
      }),
  );
  let refused: boolean = false;
  try {
    arms[0]!.prepare!((): IHumanPosture => quiet);
  } catch (error) {
    refused = error instanceof HumanRefusal;
  }
  TestValidator.predicate(
    "hands that meet with no declared grasp are refused",
    refused,
  );
}
