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
  AutoMovieMotionHumanLeg,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { nclose } from "../../../../features/internal/nclose";
import { vclose } from "../../../../features/internal/vclose";

/**
 * The swinging foot clears the floor and advances to its landing.
 *
 * Scenarios:
 * 1. Observe the foot through posed forward kinematics on a canonical standing body.
 *
 * @evidence contracts/development/testing.md#behavioral-verification The swinging foot clears the floor and advances to its landing.
 * @evidence contracts/development/testing.md#independent-expectations Halfway through symmetric timing, the swing adds the full clearance above its linear endpoints.
 * @evidence contracts/development/testing.md#distinguishing-cases The observed world landmark distinguishes body-relative and world-relative displacements.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_dynamics_primitive_leg_step(): void {
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
    AutoMovieMotionHumanLeg.step(
      body,
      clock,
      "left",
      ["start", "end"],
      stance,
      target,
      0.04,
    );
  const read = (t: number): IAutoMovieVector3 =>
    poseBones(body, resolveHumanPosture(body, primitive.write(base, t))).get(
      "leftFoot",
    )!.worldPosition;
  const start = read(0),
    mid = read(1),
    end = read(2);
  TestValidator.predicate(
    "depart and arrive",
    vclose(start, stance.ankle, 0.005) && vclose(end, target.ankle, 0.005),
  );
  TestValidator.predicate(
    "mid-swing clears floor and advances",
    nclose(mid.y, (start.y + end.y) / 2 + 0.04, 0.005) &&
      start.x < mid.x &&
      mid.x < end.x,
  );
}
