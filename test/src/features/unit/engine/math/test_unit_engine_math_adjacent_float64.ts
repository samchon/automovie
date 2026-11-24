import { adjacentAutoMovieFloat64 } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/predicates";

/**
 * `adjacentAutoMovieFloat64` steps one binary64 encoding up or down (IEEE 754
 * binary64: 52 fraction bits, so the spacing just above 1 is 2^-52 and just
 * below it 2^-53).
 *
 * Scenarios:
 *
 * 1. Unit exponent boundaries carry and borrow on positive and negative
 *    encodings.
 * 2. Signed zero and the smallest subnormal step to each other exactly.
 * 3. Stepping past the largest finite double is refused.
 */
export function test_unit_engine_math_adjacent_float64(): void {
  // 1-2. The independent binary64 neighbours.
  for (const [value, upper, expected] of [
    [1, true, 1 + 2 ** -52],
    [1, false, 1 - 2 ** -53],
    [1 - 2 ** -53, true, 1],
    [-1, true, -(1 - 2 ** -53)],
    [-1, false, -(1 + 2 ** -52)],
    [-(1 - 2 ** -53), false, -1],
    [0, true, Number.MIN_VALUE],
    [0, false, -Number.MIN_VALUE],
    [Number.MIN_VALUE, false, 0],
    [-Number.MIN_VALUE, true, -0],
  ] as const)
    TestValidator.predicate(
      `the neighbour of ${value} ${upper ? "above" : "below"}`,
      Object.is(adjacentAutoMovieFloat64(value, upper), expected),
    );

  // 3. Finite neighbour exhaustion.
  for (const [value, upper] of [
    [Number.MAX_VALUE, true],
    [-Number.MAX_VALUE, false],
  ] as const)
    TestValidator.predicate(
      "no finite neighbour past the largest double",
      throwsError(
        (): number => adjacentAutoMovieFloat64(value, upper),
        "overflowing",
      ),
    );
}