import { Quaternion } from "@automovie/engine";
import type { IAutoMovieQuaternion } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { qclose, qunit } from "../../../internal/predicates";

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
 * 5. Single X components2^±500 reach exact squared-norm certificate edges; 2^±600
 *    require the extreme-scale fallback. All retain literalX180.
 */
export function test_unit_engine_math_quaternion_normalize(): void {
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
  for (const exponent of [-600, -500, 500, 600]) {
    const normalized: IAutoMovieQuaternion = Quaternion.normalize({
      x: 2 ** exponent,
      y: 0,
      z: 0,
      w: 0,
    });
    TestValidator.predicate(
      `exact-power cardinal normalization retainsX180 at2^${exponent}`,
      qunit(normalized) &&
        qclose(normalized, { x: 1, y: 0, z: 0, w: 0 }, 1e-12),
    );
  }
}
