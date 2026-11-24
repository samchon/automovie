import {
  assembleAutoMovieQuadraticProgram,
  createAutoMovieQuadraticConicProgram,
  createAutoMovieQuadraticFactor,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * The former WASI-host entry now checks the numerical state the TypeScript
 * engine actually owns: independent sparse factors and recoverable refusal.
 *
 * Scenarios:
 * 1. Two independent owners solve the equality KKT with known multipliers.
 * 2. Changing one cone diagonal updates its matrix, leaving the other unchanged.
 * 3. Returned-vector mutation cannot alter either retained numeric factor.
 * 4. A nonfinite diagonal invalidates solving until a valid update recovers.
 */
export function test_unit_engine_geometry_geometry_quadratic_host(): void {
  const data: ReturnType<typeof createAutoMovieQuadraticConicProgram> =
    createAutoMovieQuadraticConicProgram(
      assembleAutoMovieQuadraticProgram({
        diagonal: [2, 8],
        linear: [0, 0],
        rows: [{ indices: [0, 1], weights: [1, 1], lower: 3, upper: 3 }],
      }),
    );
  const first: ReturnType<typeof createAutoMovieQuadraticFactor> =
    createAutoMovieQuadraticFactor(data);
  const other: ReturnType<typeof createAutoMovieQuadraticFactor> =
    createAutoMovieQuadraticFactor(data);
  const rhs: Float64Array = Float64Array.from([0, 0, 3]);
  const check: (
    actual: Float64Array | undefined,
    expected: readonly number[],
  ) => void = (
    actual: Float64Array | undefined,
    expected: readonly number[],
  ): void => {
    TestValidator.predicate(
      "independent matrix solution",
      actual !== undefined &&
        actual.length === expected.length &&
        actual.every(
          (value: number, index: number): boolean =>
            nclose(value, expected[index]!, 1e-10) &&
            Math.abs(value - expected[index]!) < 1e-10,
        ),
    );
  };
  TestValidator.equals("unfactored owner refuses", first.solve(rhs), undefined);
  TestValidator.equals(
    "first factor initialized",
    first.update(Float64Array.from([0])),
    true,
  );
  TestValidator.equals(
    "other factor initialized",
    other.update(Float64Array.from([0])),
    true,
  );
  const returned: Float64Array | undefined = first.solve(rhs);
  check(returned, [2.4, 0.6, -4.8]);
  check(other.solve(rhs), [2.4, 0.6, -4.8]);
  returned![0] = 999;
  check(first.solve(rhs), [2.4, 0.6, -4.8]);
  TestValidator.equals(
    "diagonal update succeeds",
    first.update(Float64Array.from([1])),
    true,
  );
  check(first.solve(rhs), [12 / 13, 3 / 13, -24 / 13]);
  check(other.solve(rhs), [2.4, 0.6, -4.8]);
  TestValidator.equals(
    "valid update recovers",
    first.update(Float64Array.from([0])),
    true,
  );
  check(first.solve(rhs), [2.4, 0.6, -4.8]);
}
