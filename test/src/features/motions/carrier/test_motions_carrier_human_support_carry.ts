import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSupportCarry,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanSupportCarry
} from "../../../../../packages/motions/src/carrier/internal/HumanSupportCarry";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** Rounding of a few rotations, metres and degrees. */
const ROUNDING: number = 1e-9;

/**
 * Check which posture geometry inherits the motion of its support.
 *
 * Scenarios:
 *
 * 1. Translate the bench from x = 1 to x = 3 m and turn it 90 degrees. A
 *    point 0.5 m ahead becomes 0.5 m to its right.
 * 2. Halfway between still and full carry, the bench origin lies at x = 2 m
 *    and yaw is 45 degrees.
 * 3. Carry the root, heading and free foot of the fixture. Preserve the goal
 *    held on the chest.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios give the support's two poses and identify which geometry moves with them.
 * @evidence contracts/development/testing.md#behavioral-verification The fixture tests full and partial rigid carry and distinguishes free and attached limb goals.
 * @evidence contracts/development/testing.md#independent-expectations The root and point expectations use a quarter-turn axis exchange and independent linear interpolation of the two origins.
 */
export function test_motions_carrier_human_support_carry(): void {
  const frame: (seconds: number) => IAutoMovieRigidTransform = (
    seconds: number,
  ): IAutoMovieRigidTransform =>
    seconds === 0
      ? { position: { x: 1, y: 0, z: 0 }, rotation: AutoMovieEngineQuaternion.identity() }
      : {
          position: { x: 3, y: 0, z: 0 },
          rotation: AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90),
        };
  const carry: IAutoMovieMotionHumanSupportCarry.ICarry = HumanSupportCarry(
    frame,
    0,
    2,
  );
  TestValidator.predicate(
    "a point on the bench",
    vclose(
      carry.point({ x: 1, y: 0, z: 0.5 }),
      { x: 3.5, y: 0, z: 0 },
      ROUNDING,
    ) && nclose(carry.yaw, 90, ROUNDING),
  );
  const still: IAutoMovieMotionHumanSupportCarry.ICarry = HumanSupportCarry(
    frame,
    0,
    0,
  );
  const origin: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
  const half: IAutoMovieMotionHumanSupportCarry.ICarry =
    HumanSupportCarry.blend(still, carry, origin, 0.5);
  TestValidator.predicate(
    "half way",
    vclose(half.point(origin), { x: 2, y: 0, z: 0 }, ROUNDING) &&
      nclose(half.yaw, 45, ROUNDING) &&
      HumanSupportCarry.blend(still, carry, origin, 0) === still &&
      HumanSupportCarry.blend(still, carry, origin, 1) === carry,
  );
  const posture: IAutoMovieMotionHumanPosture = {
    root: { x: 1, y: 0.9, z: 0.5 },
    yaw: 10,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {
      leftLeg: {
        point: { x: 1, y: 0.08, z: 0.5 },
        bend: { x: 1, y: 0.5, z: 0.8 },
      },
      rightArm: {
        point: { x: 1, y: 1.3, z: 0.6 },
        bend: { x: 1, y: 1.1, z: 0.4 },
        on: "chest",
      },
    },
  };
  const carried: IAutoMovieMotionHumanPosture = HumanSupportCarry.posture(
    carry,
    posture,
  );
  TestValidator.predicate(
    "a carried posture",
    vclose(carried.root, { x: 3.5, y: 0.9, z: 0 }, ROUNDING) &&
      nclose(carried.yaw, 100, ROUNDING) &&
      vclose(
        carried.limbs.leftLeg!.point,
        { x: 3.5, y: 0.08, z: 0 },
        ROUNDING,
      ) &&
      carried.limbs.rightArm === posture.limbs.rightArm,
  );
}
