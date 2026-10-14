import { IAutoMovieQuaternion } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { Quaternion } from "../../../../packages/engine/src/math/Quaternion";
import { qclose, qunit } from "../internal/predicates";

/**
 * Quaternion normalization retains finite nonzero directions at ordinary and
 * extreme magnitudes and maps the exact zero quaternion to identity.
 *
 * Scenarios:
 *
 * 1. A pure-scale quaternion (0,0,0,2) normalizes onto the identity.
 * 2. An arbitrary non-unit quaternion (1,2,3,4) normalizes to unit length.
 * 3. The zero quaternion (0,0,0,0), magnitude 0, returns the identity instead of
 *    NaNs. Exercises the zero-length guard a normal rotation never hits.
 * 4. Equal components at tiny, huge and subnormal magnitudes normalize to the
 *    independently known four-component direction (0.5,0.5,0.5,0.5).
 *
 * @evidence contracts/testing.md#behavioral-verification Calls Quaternion.normalize and checks identity, unit magnitude and equal-component direction, catching overflow or underflow that loses a finite quaternion orientation.
 * @evidence contracts/testing.md#independent-expectations Four equal nonzero components have norm twice their magnitude and therefore normalize to four halves; zero quaternion follows the declared identity convention.
 * @evidence contracts/testing.md#distinguishing-cases Covers scaled identity, ordinary unequal values, exact zero and tiny/huge/subnormal equal components; inverse and interpolation tests own their separate compositions.
 * @evidence contracts/testing.md#execution-ownership The discoverable math entry directly imports pure quaternion source and owns local scalar cases without a real host or native artifact.
 */
export function test_math_quaternion_normalize(): void {
  TestValidator.predicate(
    "normalize (0,0,0,2) → identity",
    qclose(
      Quaternion.normalize({ x: 0, y: 0, z: 0, w: 2 }),
      Quaternion.identity(),
    ),
  );
  TestValidator.predicate(
    "normalize yields a unit quaternion",
    qunit(Quaternion.normalize({ x: 1, y: 2, z: 3, w: 4 })),
  );
  TestValidator.predicate(
    "normalize of the zero quaternion → identity",
    qclose(
      Quaternion.normalize({ x: 0, y: 0, z: 0, w: 0 }),
      Quaternion.identity(),
    ),
  );
  for (const component of [1e-300, 1e300, Number.MIN_VALUE]) {
    const normalized: IAutoMovieQuaternion = Quaternion.normalize({
      x: component,
      y: component,
      z: component,
      w: component,
    });
    TestValidator.predicate(
      "finite extreme magnitudes retain the same unit direction",
      qunit(normalized) &&
        qclose(normalized, { x: 0.5, y: 0.5, z: 0.5, w: 0.5 }),
    );
  }
}
