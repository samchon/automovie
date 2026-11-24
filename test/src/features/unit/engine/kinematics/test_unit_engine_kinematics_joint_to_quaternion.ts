import { jointToQuaternion } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { qclose } from "../../../internal/qclose";

/** Rounding of one half-angle sine and cosine. */
const ROUNDING: number = 1e-12;

/** Sine and cosine of 45 degrees, the half of a quarter turn. */
const HALF_ROOT_TWO: number = Math.SQRT1_2;

/**
 * `jointToQuaternion` composes clinical joint angles into a rotation about the
 * default axes: flexion about +X, twist about +Y, abduction about +Z.
 *
 * Scenarios:
 *
 * 1. Flexion 90 alone is (sin 45, 0, 0, cos 45).
 * 2. Twist 90 alone is (0, sin 45, 0, cos 45).
 * 3. Abduction 90 alone is (0, 0, sin 45, cos 45).
 * 4. Null angles are the identity.
 */
export function test_unit_engine_kinematics_joint_to_quaternion(): void {
  const pose = (
    flexion: number | null,
    abduction: number | null,
    twist: number | null,
  ): Parameters<typeof jointToQuaternion>[0] => ({
    flexion,
    abduction,
    twist,
  });
  TestValidator.predicate(
    "flexion",
    qclose(
      jointToQuaternion(pose(90, null, null)),
      { x: HALF_ROOT_TWO, y: 0, z: 0, w: HALF_ROOT_TWO },
      ROUNDING,
    ),
  );
  TestValidator.predicate(
    "twist",
    qclose(
      jointToQuaternion(pose(null, null, 90)),
      { x: 0, y: HALF_ROOT_TWO, z: 0, w: HALF_ROOT_TWO },
      ROUNDING,
    ),
  );
  TestValidator.predicate(
    "abduction",
    qclose(
      jointToQuaternion(pose(null, 90, null)),
      { x: 0, y: 0, z: HALF_ROOT_TWO, w: HALF_ROOT_TWO },
      ROUNDING,
    ),
  );
  TestValidator.predicate(
    "the identity",
    qclose(
      jointToQuaternion(pose(null, null, null)),
      { x: 0, y: 0, z: 0, w: 1 },
      ROUNDING,
    ),
  );
}
