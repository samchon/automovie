import { Quaternion } from "@automovie/engine";
import type { IAutoMovieQuaternion } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { qclose, qunit } from "../internal/predicates";

/**
 * Quaternion multiplication retains the neutral rotation and composes two Y quarter-turns into a half-turn; a zero axis follows the declared identity convention.
 *
 * Scenarios:
 *
 * 1. Identity is neutral on both sides of `multiply`.
 * 2. Composing Y90 with itself yields Y180.
 * 3. The product of two unit quaternions is unit.
 * 4. `fromAxisAngle` on a zero-length axis returns the identity (the zero-axis
 *    guard a real rotation axis never reaches).
 *
 * @evidence contracts/testing.md#behavioral-verification Executes identity, axis-angle and multiplication, checking neutral operands on both sides, two quarter-turns, unit product and the zero-axis identity. Wrong composition or degenerate-axis NaNs fail these assertions.
 * @evidence contracts/testing.md#independent-expectations Neutrality, composition of equal-axis angles and unit-norm closure are quaternion algebra; zero-axis identity is the explicit API convention. The half-turn comparison shares fromAxisAngle with its input construction and does not independently prove that constructor's component formula.
 * @evidence contracts/testing.md#distinguishing-cases Keeps left/right neutrality, repeated Y rotation, a mixed-axis unit product and exact zero-axis input. General noncommuting products and interpolation regimes are owned by Euler and slerp tests; malformed numeric inputs are not admitted here.
 * @evidence contracts/testing.md#execution-ownership The discoverable named entry runs its original assertions through portable Quaternion runtime methods, without consumer installation, host startup, native build or dynamic registration.
 */
export function test_math_quaternion_identity_multiply(): void {
  const id: IAutoMovieQuaternion = Quaternion.identity();
  const qY90: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 1, z: 0 },
    90,
  );

  TestValidator.predicate(
    "zero-length axis → identity",
    qclose(Quaternion.fromAxisAngle({ x: 0, y: 0, z: 0 }, 90), id),
  );

  TestValidator.predicate(
    "identity * q = q",
    qclose(Quaternion.multiply(id, qY90), qY90),
  );
  TestValidator.predicate(
    "q * identity = q",
    qclose(Quaternion.multiply(qY90, id), qY90),
  );
  TestValidator.predicate(
    "Y90 ∘ Y90 = Y180",
    qclose(
      Quaternion.multiply(qY90, qY90),
      Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 180),
    ),
  );
  TestValidator.predicate(
    "product of unit quats is unit",
    qunit(
      Quaternion.multiply(
        qY90,
        Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 37),
      ),
    ),
  );
}
