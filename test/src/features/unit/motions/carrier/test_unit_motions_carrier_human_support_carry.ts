import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSupportCarry,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanSupportCarry } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/** Rounding of a few rotations, metres and degrees. */
const ROUNDING: number = 1e-9;

/**
 * `HumanSupportCarry` carries what stands on a moving support from where it was
 * planned to a later second: a point by the support's motion since the start, a
 * turn and a heading by its turn; `blend` passes from one carry to another
 * about an anchor, and `posture` carries a posture's root, heading and free
 * limb goals, leaving a goal held on a bone where it is.
 *
 * Scenarios, a bench at (1, 0, 0) at 0 s that by 2 s has moved to (3, 0, 0) and
 * turned 90 degrees about +Y:
 *
 * 1. A point 0.5 m along +Z of the bench at 0 s is carried to 0.5 m along +X of it
 *    at 2 s, the turn's heading 90.
 * 2. Half way between staying still and that carry, about the bench's origin, the
 *    origin lies half way to (3, 0, 0) and the heading is 45.
 * 3. A posture rooted on the bench at 0 s is rooted on it at 2 s, its heading
 *    turned 90, its free foot goal carried and a goal held on the chest kept.
 */
export function test_unit_motions_carrier_human_support_carry(): void {
  const frame: (seconds: number) => IAutoMovieRigidTransform = (
    seconds: number,
  ): IAutoMovieRigidTransform =>
    seconds === 0
      ? { position: { x: 1, y: 0, z: 0 }, rotation: Quaternion.identity() }
      : {
          position: { x: 3, y: 0, z: 0 },
          rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90),
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
