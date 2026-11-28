import { AutoMovieEngineMath } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `seededValue` is one deterministic sample in [0, 1) from ordered seed parts.
 *
 * Scenarios:
 *
 * 1. The same parts give the same value, inside [0, 1).
 * 2. Order matters: (1, 2) and (2, 1) differ, and an extra part changes the value.
 * 3. 1000 consecutive seeds stay inside [0, 1) and their mean is near 1/2 (within
 *    0.05).
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers reproducibility, order and arity sensitivity, output range and one fixed sample spread.
 * @evidence contracts/development/testing.md#behavioral-verification Calls seededValue with repeated and permuted seed parts, then reads 1,000 individual seeds and records their range and mean.
 * @evidence contracts/development/testing.md#independent-expectations The fixed [0, 1) bounds and the predetermined 0.05 window around one half reject out-of-range or grossly skewed outputs. The paired tuples specifically detect loss of order or the trailing part.
 */
export function test_engine_math_seeded_value(): void {
  const value: number = AutoMovieEngineMath.seededValue(1, 2, 3);
  TestValidator.equals("pure", AutoMovieEngineMath.seededValue(1, 2, 3), value);
  TestValidator.predicate("range", value >= 0 && value < 1);
  TestValidator.predicate("order", AutoMovieEngineMath.seededValue(1, 2) !== AutoMovieEngineMath.seededValue(2, 1));
  TestValidator.predicate(
    "extra part",
    AutoMovieEngineMath.seededValue(1, 2) !== AutoMovieEngineMath.seededValue(1, 2, 0),
  );
  let sum: number = 0;
  let inside: boolean = true;
  for (let seed: number = 0; seed < 1000; seed++) {
    const sample: number = AutoMovieEngineMath.seededValue(seed);
    inside &&= sample >= 0 && sample < 1;
    sum += sample;
  }
  TestValidator.predicate(
    "spread",
    inside && Math.abs(sum / 1000 - 0.5) < 0.05,
  );
}
