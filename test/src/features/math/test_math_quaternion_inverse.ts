import { Quaternion } from "@automovie/engine";
import type { IAutoMovieQuaternion } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { qclose, qunit } from "../internal/predicates";

/**
 * Quaternion inversion reverses a Y quarter-turn and returns a unit rotation for the existing nonunit input.
 *
 * Scenarios:
 *
 * 1. For a unit quaternion `q`, `q * inverse(q) = identity` (the defining property
 *    of an inverse). Hand case: a 90° rotation about +Y composed with its
 *    inverse returns to identity.
 * 2. The inverse of a rotation about +Y by 90° equals a rotation about +Y by −90°
 *    (conjugate flips the vector part, keeps `w`).
 * 3. A non-unit input still yields a unit quaternion (the normalization keeps a
 *    near-unit rotation valid); nonfinite inputs are outside this test.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls inverse and multiplies its result with the original Y rotation, checking neutral composition, opposite angle and unit length for (1,2,3,4). It catches conjugate-sign and normalization errors on these inputs.
 * @evidence contracts/testing.md#independent-expectations A rotation composed with its inverse is neutral and the inverse of a Y quarter-turn has angle -90 degrees. Unit magnitude is measured independently with hypot, while angle/product comparisons reuse other Quaternion methods and cannot rule out a shared convention error.
 * @evidence contracts/testing.md#distinguishing-cases Preserves the supported unit Y rotation and finite nonunit input. Zero and extreme normalization are owned by quaternion-normalize; arbitrary axis, malformed and nonfinite inverses are not covered here.
 * @evidence contracts/testing.md#execution-ownership The named math function runs these synchronous portable runtime calls without a consumer install, native build, process, browser, GPU or dynamic case registration.
 */
export function test_math_quaternion_inverse(): void {
  const y90: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 1, z: 0 },
    90,
  );
  TestValidator.predicate(
    "q * inverse(q) → identity",
    qclose(
      Quaternion.multiply(y90, Quaternion.inverse(y90)),
      Quaternion.identity(),
    ),
  );
  TestValidator.predicate(
    "inverse of +Y 90° equals +Y −90°",
    qclose(
      Quaternion.inverse(y90),
      Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, -90),
    ),
  );
  TestValidator.predicate(
    "inverse of a non-unit quaternion is unit",
    qunit(Quaternion.inverse({ x: 1, y: 2, z: 3, w: 4 })),
  );
}
