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

import { motionHumanBody } from "../../../internal/motionHumanBody";
import { vclose } from "../../../internal/vclose";

/**
 * A planted foot holds its world coordinate as the supported body moves.
 *
 * Scenarios:
 *
 * 1. Observe the foot through posed forward kinematics on a canonical standing
 *    body.
 *
 * @evidence contracts/development/testing.md#behavioral-verification A planted foot holds its world coordinate as the supported body moves.
 * @evidence contracts/development/testing.md#independent-expectations Moving the pelvis vertically between the closed endpoints changes the chain configuration while the foot anchor stays fixed.
 * @evidence contracts/development/testing.md#distinguishing-cases The observed world landmark distinguishes body-relative and world-relative displacements.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_dynamics_primitive_leg_plant(): void {
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

  const primitive: IAutoMovieMotionHumanPrimitive =
    AutoMovieMotionHumanLeg.plant(
      body,
      clock,
      "left",
      ["start", "end"],
      stance,
    );

  for (const t of [0, 1, 2]) {
    const moving: IAutoMovieMotionHumanPosture = {
      ...base,
      root: { ...base.root, y: base.root.y - 0.02 * t },
    };
    const posed: IAutoMovieMotionHumanPosture = primitive.write(moving, t);
    const ankle: IAutoMovieVector3 = poseBones(
      body,
      resolveHumanPosture(body, posed),
    ).get("leftFoot")!.worldPosition;
    TestValidator.predicate(
      "stance holds the world anchor",
      vclose(ankle, stance.ankle, 0.005),
    );
  }
}
