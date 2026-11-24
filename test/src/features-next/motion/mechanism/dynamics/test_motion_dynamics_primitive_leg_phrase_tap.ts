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
 * A tapping foot touches its target between its outward and return arcs.
 *
 * Scenarios:
 * 1. Observe the foot through posed forward kinematics on a canonical standing body.
 *
 * @evidence contracts/development/testing.md#behavioral-verification A tapping foot touches its target between its outward and return arcs.
 * @evidence contracts/development/testing.md#independent-expectations The target sits on the stance plane and both swings clear it.
 * @evidence contracts/development/testing.md#distinguishing-cases The observed world landmark distinguishes body-relative and world-relative displacements.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_dynamics_primitive_leg_phrase_tap(): void {
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
    AutoMovieMotionHumanLegPhrase.tap({
      body,
      side: "left",
      clock,
      stance,
      target: (): IAutoMovieMotionHumanFoot.IPlacement => target,
      clearance: 0.04,
      contact: { kind: "plant", support: { kind: "ground" } },
    });
  const read = (t: number): IAutoMovieVector3 =>
    poseBones(body, resolveHumanPosture(body, primitive.write(base, t))).get(
      "leftFoot",
    )!.worldPosition;
  TestValidator.predicate("arrives", vclose(read(1), target.ankle, 0.005));
  TestValidator.predicate(
    "outward clearance",
    read(0.5).y > target.ankle.y + 0.005,
  );
  TestValidator.predicate(
    "return clearance",
    read(1.75).y > target.ankle.y + 0.005,
  );
}
