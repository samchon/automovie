import type {
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanStance } from "@automovie/motions";
import {
  AutoMovieMotionClock,
  AutoMovieMotionHumanLegPhrase,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { vclose } from "../../../../features/internal/vclose";

/**
 * The swing extends in the entered forward direction and returns to the standing foot.
 *
 * Scenarios:
 * 1. Observe the foot through posed forward kinematics on a canonical standing body.
 *
 * @evidence contracts/development/testing.md#behavioral-verification The swing extends in the entered forward direction and returns to the standing foot.
 * @evidence contracts/development/testing.md#independent-expectations A quarter turn directs local forward along world X.
 * @evidence contracts/development/testing.md#distinguishing-cases The observed world landmark distinguishes body-relative and world-relative displacements.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_contact_primitive_leg_phrase_swing(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const base: IAutoMovieMotionHumanPosture =
    AutoMovieMotionHumanStance.stand.posture(body, { x: 1, y: 0, z: 2 }, 90);
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock.of(2, [
    { name: "ready", seconds: 0.25 },
    { name: "strokeStart", seconds: 0.5 },
    { name: "stroke", seconds: 1 },
    { name: "strokeEnd", seconds: 1.25 },
    { name: "relax", seconds: 1.5 },
  ]);
  const stance: IAutoMovieMotionHumanFoot.IPlacement = {
    ankle: base.limbs.leftLeg!.point,
    rotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
  };
  const target: IAutoMovieMotionHumanFoot.IPlacement = {
    ...stance,
    ankle: { ...stance.ankle, x: stance.ankle.x + 0.05 },
  };
  const primitive: IAutoMovieMotionHumanPrimitive =
    AutoMovieMotionHumanLegPhrase.swing({
      body,
      side: "left",
      clock,
      stance,
      chamber: (): IAutoMovieMotionHumanFoot.IPlacement => stance,
      target: (): IAutoMovieMotionHumanFoot.IPlacement => target,
    });
  const read = (t: number): IAutoMovieVector3 =>
    poseBones(body, resolveHumanPosture(body, primitive.write(base, t))).get(
      "leftFoot",
    )!.worldPosition;
  TestValidator.predicate(
    "signed extension",
    vclose(read(1), target.ankle, 0.005),
  );
  TestValidator.predicate("return", vclose(read(2), stance.ankle, 0.005));
}
