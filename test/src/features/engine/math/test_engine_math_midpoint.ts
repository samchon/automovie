import { AutoMovieEngineMath } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `midpoint` is the binary64 mean of two coordinates and stays finite where the
 * sum overflows.
 *
 * Scenarios:
 *
 * 1. Ordinary pair: (2, 4) is 3 and (-6, 2) is -2.
 * 2. Two equal largest doubles give that double, positive and negative.
 */
export function test_engine_math_midpoint(): void {
  TestValidator.equals("ordinary", AutoMovieEngineMath.midpoint(2, 4), 3);
  TestValidator.equals("opposite", AutoMovieEngineMath.midpoint(-6, 2), -2);
  TestValidator.equals(
    "positive overflow",
    AutoMovieEngineMath.midpoint(Number.MAX_VALUE, Number.MAX_VALUE),
    Number.MAX_VALUE,
  );
  TestValidator.equals(
    "negative overflow",
    AutoMovieEngineMath.midpoint(-Number.MAX_VALUE, -Number.MAX_VALUE),
    -Number.MAX_VALUE,
  );
}
