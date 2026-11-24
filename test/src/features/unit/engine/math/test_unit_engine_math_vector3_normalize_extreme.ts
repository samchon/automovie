import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, vclose } from "../../../internal/predicates";

/**
 * Finite directions must not disappear when their squared magnitude overflows
 * or underflows. The 3-4-5 and diagonal oracles remain independent of the
 * scale.
 *
 * Scenarios:
 *
 * 1. Huge and tiny axis vectors retain unit direction and representable length.
 * 2. Diagonals, subnormal components and an unrepresentable total magnitude retain
 *    a finite unit direction. Zero and existing nonfinite propagation stay
 *    distinct from those finite cases.
 * 3. Safe squared-magnitude boundary values retain their analytic axis norm.
 */
export function test_unit_engine_math_vector3_normalize_extreme(): void {
  for (const size of [1e155, 1e-200, Number.MIN_VALUE, 2 ** -511, 2 ** 511]) {
    const vector: IAutoMovieVector3 = { x: 0, y: 0, z: size };
    TestValidator.predicate(
      "finite extreme direction survives",
      vclose(Vector3.normalize(vector), { x: 0, y: 0, z: 1 }),
    );
    TestValidator.predicate(
      "representable axis length survives",
      nclose(Vector3.length(vector) / size, 1),
    );
  }
  for (const size of [1e155, 1e-200]) {
    TestValidator.predicate(
      "scaled 3-4-5 direction",
      vclose(Vector3.normalize({ x: 3 * size, y: -4 * size, z: 0 }), {
        x: 0.6,
        y: -0.8,
        z: 0,
      }),
    );
    TestValidator.predicate(
      "scaled 3-4-5 length",
      nclose(Vector3.length({ x: 3 * size, y: 4 * size, z: 0 }) / size, 5),
    );
  }
  for (const size of [Number.MAX_VALUE, Number.MIN_VALUE])
    TestValidator.predicate(
      "diagonal survives extreme range",
      vclose(Vector3.normalize({ x: size, y: size, z: size }), {
        x: 1 / Math.sqrt(3),
        y: 1 / Math.sqrt(3),
        z: 1 / Math.sqrt(3),
      }),
    );
  TestValidator.predicate(
    "only unrepresentable magnitude overflows",
    Vector3.length({ x: Number.MAX_VALUE, y: Number.MAX_VALUE, z: 0 }) ===
      Infinity,
  );
  TestValidator.predicate(
    "zero remains zero",
    vclose(Vector3.normalize(Vector3.create()), Vector3.create(), 0),
  );
}
