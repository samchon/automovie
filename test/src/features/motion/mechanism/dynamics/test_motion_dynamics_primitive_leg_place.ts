import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanStance } from "@automovie/motions";
import {
  AutoMovieMotionHumanLeg,
  HumanFrame,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../internal/motionHumanBody";
import { vclose } from "../../../internal/vclose";

/**
 * The placed foot reaches a translated world marker from a quarter-turned body.
 *
 * Scenarios:
 *
 * 1. Observe the foot through posed forward kinematics on a canonical standing
 *    body.
 *
 * @evidence contracts/development/testing.md#behavioral-verification The placed foot reaches a translated world marker from a quarter-turned body.
 * @evidence contracts/development/testing.md#independent-expectations A local forward displacement with a quarter turn adds world X.
 * @evidence contracts/development/testing.md#distinguishing-cases The observed world landmark distinguishes body-relative and world-relative displacements.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_dynamics_primitive_leg_place(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const base: IAutoMovieMotionHumanPosture =
    AutoMovieMotionHumanStance.stand.posture(body, { x: 1, y: 0, z: 2 }, 90);

  const stance: IAutoMovieMotionHumanFoot.IPlacement = {
    ankle: base.limbs.leftLeg!.point,
    rotation: { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
  };
  const target: IAutoMovieMotionHumanFoot.IPlacement = {
    ...stance,
    ankle: HumanFrame.point(
      { origin: stance.ankle, yaw: base.yaw },
      { x: 0, y: 0, z: 0.05 },
    ),
  };
  const primitive: IAutoMovieMotionHumanPrimitive =
    AutoMovieMotionHumanLeg.place({
      body,
      side: "left",
      from: 0,
      to: 2,
      placement: (): IAutoMovieMotionHumanFoot.IPlacement => target,
      planted: (): boolean => false,
    });
  const read = (t: number): IAutoMovieVector3 =>
    poseBones(body, resolveHumanPosture(body, primitive.write(base, t))).get(
      "leftFoot",
    )!.worldPosition;
  const ankle: IAutoMovieVector3 = read(1);
  TestValidator.predicate(
    "world ankle",
    vclose(
      ankle,
      { x: stance.ankle.x + 0.05, y: stance.ankle.y, z: stance.ankle.z },
      0.005,
    ),
  );
}
