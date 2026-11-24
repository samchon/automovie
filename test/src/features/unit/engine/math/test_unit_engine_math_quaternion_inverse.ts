import { Quaternion } from "@automovie/engine";
import type { IAutoMovieQuaternion } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { qclose, qunit } from "../../../internal/predicates";

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
 */
export function test_unit_engine_math_quaternion_inverse(): void {
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
