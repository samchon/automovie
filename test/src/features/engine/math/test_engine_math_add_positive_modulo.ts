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
 */
export function test_engine_math_add_positive_modulo(): void {
  TestValidator.equals("wrap", AutoMovieEngineMath.addPositiveModulo(350, 20, 360), 10);
  TestValidator.equals("whole period", AutoMovieEngineMath.addPositiveModulo(5, 360, 360), 5);
  TestValidator.equals("negative", AutoMovieEngineMath.addPositiveModulo(-10, 0, 360), 350);
}
