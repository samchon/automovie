import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanSupportCarry,
  type IHumanPosture,
  type IHumanProp,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * The one owner of support-frame goals (#3491): a posture planned in the
 * world at a start is carried by the support's rigid motion since then.
 *
 * Scenarios, a support that moves 2 m/s along +Z and turns 10 degrees a
 * second about +Y from the origin:
 * 1. A still support carries nothing: every point and the heading stay.
 * 2. After 1 s a point on the support's origin is carried to (0, 0, 2) and
 *    the heading turned by 10 degrees, within 1e-9.
 * 3. A point 1 m to the support's +X at the start is carried 1 m along the
 *    turned +X from the moved origin, within 1e-9.
 * 4. A carried posture moves its root, its heading and every limb goal's
 *    point, bend and rotation, leaves a goal on a bone untouched, and keeps
 *    its joint angles.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Carries points and a posture through a moving frame; a carry that ignores the turn, moves a bone-attached goal or changes joint angles fails.
 * @evidence contracts/development/testing.md#independent-expectations The carried places are the rigid motion's, written here.
 * @evidence contracts/development/testing.md#distinguishing-cases A still and a moving support; the origin and an off-origin point; free and bone-attached goals.
 * @evidence contracts/development/testing.md#execution-ownership Calls the carry directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the four numbered scenarios.
 */
export function test_human_motion_support_carry(): void {
  const moving = (t: number): IHumanProp.IFrame => ({
    position: { x: 0, y: 0, z: 2 * t },
    rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 10 * t),
  });
  const still = (): IHumanProp.IFrame => ({
    position: { x: 1, y: 0, z: 1 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  });
  const close = (a: IAutoMovieVector3, b: IAutoMovieVector3): boolean =>
    Vector3.length(Vector3.subtract(a, b)) <= 1e-9;

  // 1. A still support.
  const none = HumanSupportCarry.of(still, 0, 3);
  TestValidator.predicate(
    "a still support carries nothing",
    close(none.point({ x: 3, y: 1, z: -2 }), { x: 3, y: 1, z: -2 }) && Math.abs(none.yaw) <= 1e-9,
  );

  // 2 and 3. A moving support.
  const carry = HumanSupportCarry.of(moving, 0, 1);
  TestValidator.predicate(
    "the support's origin is carried with it",
    close(carry.point({ x: 0, y: 0, z: 0 }), { x: 0, y: 0, z: 2 }),
  );
  TestValidator.predicate(`the heading turns with it (${carry.yaw})`, Math.abs(carry.yaw - 10) <= 1e-9);
  const side: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 10),
    { x: 1, y: 0, z: 0 },
  );
  TestValidator.predicate(
    "an off-origin point turns about the moved origin",
    close(carry.point({ x: 1, y: 0, z: 0 }), Vector3.add({ x: 0, y: 0, z: 2 }, side)),
  );

  // 4. A posture.
  const posture: IHumanPosture = {
    root: { x: 0, y: 1, z: 0 },
    yaw: 5,
    pitch: 0,
    roll: 0,
    joints: { spine: [3, 0, 0] },
    limbs: {
      rightArm: {
        point: { x: 0.4, y: 1.4, z: 0.3 },
        bend: { x: 0.6, y: 1.1, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
      },
      leftArm: {
        point: { x: -0.1, y: 1.2, z: 0.1 },
        bend: { x: -0.4, y: 1.1, z: 0 },
        on: "chest",
      },
    },
  };
  const carried: IHumanPosture = HumanSupportCarry.posture(carry, posture);
  TestValidator.predicate(
    "the root and the heading are carried",
    close(carried.root, carry.point(posture.root)) && Math.abs(carried.yaw - 15) <= 1e-9,
  );
  TestValidator.predicate(
    "a free goal is carried, point, bend and rotation",
    close(carried.limbs.rightArm!.point, carry.point(posture.limbs.rightArm!.point)) &&
      close(carried.limbs.rightArm!.bend, carry.point(posture.limbs.rightArm!.bend)) &&
      Math.abs(Quaternion.angle(carried.limbs.rightArm!.rotation!, carry.turn)) <= 1e-6,
  );
  TestValidator.equals("a goal on a bone is left alone", carried.limbs.leftArm, posture.limbs.leftArm);
  TestValidator.equals("joint angles stay", carried.joints, posture.joints);
}
