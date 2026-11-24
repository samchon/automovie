import { Quaternion } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { qclose } from "../../../../features/internal/qclose";
import { vclose } from "../../../../features/internal/vclose";

/**
 * Noncommuting joint rotations act on a basis vector in the declared order.
 *
 * Scenarios:
 * 1. Evaluate the public operation on the same geometry across different orientations.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Noncommuting joint rotations act on a basis vector in the declared order.
 * @evidence contracts/development/testing.md#independent-expectations The ninety-degree Y turn sends forward to X, which the subsequent X turn leaves fixed.
 * @evidence contracts/development/testing.md#distinguishing-cases Repeated and changed frames have independently known world-space results.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_dynamics_joint_orientation(): void {
  const first = Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90);
  const second = Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90);
  const product = Quaternion.multiply(first, second);
  TestValidator.predicate(
    "right operand acts first",
    vclose(Quaternion.rotateVector(product, { x: 0, y: 0, z: 1 }), {
      x: 1,
      y: 0,
      z: 0,
    }),
  );
  const negative = {
    x: -product.x,
    y: -product.y,
    z: -product.z,
    w: -product.w,
  };
  TestValidator.predicate(
    "antipodal interpolation stays at one orientation",
    qclose(Quaternion.slerp(product, negative, 0.5), product),
  );
}
