import { Quaternion } from "@automovie/engine";
import type { IAutoMovieQuaternion } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { qclose, qunit } from "../internal/predicates";

/**
 * Quaternion inversion reverses a Y quarter-turn and returns a unit rotation
 * for the existing nonunit input.
 *
 * Scenarios:
 *
 * 1. For a unit quaternion `q`, `q * inverse(q) = identity` (the defining property
 *    of an inverse). Hand case: a 90° rotation about +Y composed with its
 *    inverse returns to identity.
 * 2. The inverse of a rotation about +Y by 90° equals a rotation about +Y by −90°
 *    (conjugate flips the vector part, keeps `w`).
 * 3. A non-unit input still yields a unit quaternion (the normalization keeps a
 *    near-unit rotation valid).
 * 4. A sole X component2^±500 or2^±600 inverts to literal(-1,0,0,0). These cover
 *    exact squared-norm certificate edges and extreme fallback.
 * 5. Exact zero retains the identity convention; a NaN component propagates NaN to
 *    every normalized component rather than manufacturing a rotation.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls inverse and multiplies its result with the original Y rotation, checking neutral composition, opposite angle and unit length for (1,2,3,4). Independent literal cardinal/zero/nonfinite outputs additionally catch conjugate-sign or unsafe normalization specialization errors without using another quaternion method as the expected answer.
 * @evidence contracts/development/testing.md#independent-expectations A rotation composed with its inverse is neutral and the inverse of a Y quarter-turn has angle -90 degrees. Unit magnitude is measured independently with hypot. Conjugating a positive sole X component gives exactly(-1,0,0,0) after normalization; powers2^±500 square to2^±1000, while2^±600 require scaling. Zero uses the declared identity convention and NaN propagates through norm/reciprocal/products. Earlier angle/product comparisons remain supplementary and cannot rule out a shared convention error.
 * @evidence contracts/development/testing.md#distinguishing-cases Preserves the supported unit Y rotation and finite nonunit input. Adds actual inverse normalization at exact-power boundaries, extreme finite scales, zero and NaN. Quaternion-normalize owns the broader equal-component/subnormal matrix; arbitrary dense-axis malformed inverses are outside this entry.
 * @evidence contracts/development/testing.md#execution-ownership The named math function runs these synchronous portable runtime calls without a consumer install, native build, process, browser, GPU or dynamic case registration.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: For a unit quaternion `q`, `q * inverse(q) = identity` (the defining property).
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
  for (const exponent of [-600, -500, 500, 600]) {
    const actual: IAutoMovieQuaternion = Quaternion.inverse({
      x: 2 ** exponent,
      y: 0,
      z: 0,
      w: 0,
    });
    TestValidator.predicate(
      `scalar inverse normalization retains literal-X180 at2^${exponent}`,
      qunit(actual) &&
        nclose(actual.x, -1, 0) &&
        nclose(actual.y, 0, 0) &&
        nclose(actual.z, 0, 0) &&
        nclose(actual.w, 0, 0),
    );
  }
  const zero: IAutoMovieQuaternion = Quaternion.inverse({
    x: 0,
    y: 0,
    z: 0,
    w: 0,
  });
  TestValidator.predicate(
    "inverse normalization retains zero identity",
    nclose(zero.x, 0, 0) &&
      nclose(zero.y, 0, 0) &&
      nclose(zero.z, 0, 0) &&
      nclose(zero.w, 1, 0),
  );
}
