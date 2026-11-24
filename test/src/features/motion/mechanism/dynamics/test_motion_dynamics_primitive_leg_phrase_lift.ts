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

import { motionHumanBody } from "../../../internal/motionHumanBody";
import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/**
 * One foot rises and returns while the opposite foot bears the body.
 *
 * Scenarios:
 *
 * 1. Observe the foot through posed forward kinematics on a canonical standing
 *    body.
 *
 * @evidence contracts/development/testing.md#behavioral-verification One foot rises and returns while the opposite foot bears the body.
 * @evidence contracts/development/testing.md#independent-expectations Translations of a rigid horizontal foot raise its ankle and toes by the same amount.
 * @evidence contracts/development/testing.md#distinguishing-cases The observed world landmark distinguishes body-relative and world-relative displacements.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_dynamics_primitive_leg_phrase_lift(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const base: IAutoMovieMotionHumanPosture =
    AutoMovieMotionHumanStance.stand.posture(body, { x: 1, y: 0, z: 2 }, 90);
  const clock: IAutoMovieMotionClock = AutoMovieMotionClock(2, [
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
    ankle: { ...stance.ankle, y: stance.ankle.y + 0.05 },
  };
  const primitive: IAutoMovieMotionHumanPrimitive =
    AutoMovieMotionHumanLegPhrase.lift({
      body,
      side: "left",
      clock,
      stance,
      raised: (): IAutoMovieMotionHumanFoot.IPlacement => target,
    });
  const read = (t: number): IAutoMovieVector3 =>
    poseBones(body, resolveHumanPosture(body, primitive.write(base, t))).get(
      "leftFoot",
    )!.worldPosition;
  const apex = read(1);
  TestValidator.predicate(
    "vertical excursion",
    nclose(apex.y - stance.ankle.y, 0.05, 0.005),
  );
  TestValidator.predicate("return", vclose(read(2), stance.ankle, 0.005));
  const support: IAutoMovieVector3 = poseBones(
    body,
    resolveHumanPosture(body, primitive.write(base, 1)),
  ).get("rightFoot")!.worldPosition;
  TestValidator.predicate(
    "opposite support",
    vclose(support, base.limbs.rightLeg!.point, 0.005),
  );
}
