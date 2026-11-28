import { AutoMovieEngineMath } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `addPositiveModulo` adds an offset on a cyclic domain of a given period.
 *
 * Scenarios:
 *
 * 1. 350 + 20 on a 360 cycle is 10.
 * 2. A whole-period offset leaves 5 unchanged, and a negative value wraps: -10 + 0
 *    is 350.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers adding degree offsets across the cycle seam, adding one whole turn, and reducing a negative starting angle.
 * @evidence contracts/development/testing.md#behavioral-verification Calls addPositiveModulo directly with three scalar angle pairs on a 360-degree cycle.
 * @evidence contracts/development/testing.md#independent-expectations The expected residues are 370 minus 360, 365 minus 360, and negative ten plus 360. Whole-period and negative cases distinguish ordinary addition from cyclic addition.
 */
export function test_engine_math_add_positive_modulo(): void {
  TestValidator.equals("wrap", AutoMovieEngineMath.addPositiveModulo(350, 20, 360), 10);
  TestValidator.equals("whole period", AutoMovieEngineMath.addPositiveModulo(5, 360, 360), 5);
  TestValidator.equals("negative", AutoMovieEngineMath.addPositiveModulo(-10, 0, 360), 350);
}
