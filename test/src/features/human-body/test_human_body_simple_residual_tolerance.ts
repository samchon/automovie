import { humanBodySimpleResidualsMet } from "@automovie/human/body/simple/humanBodySimpleResidualsMet";
import { TestValidator } from "@nestia/e2e";

/**
 * Relative residuals stop only inside the actual measurement's absolute budget.
 *
 * Scenarios:
 * 1. A 100 kg target with 1 kg tolerance admits either signed one-percent
 *    residual at its boundary and refuses the adjacent larger residual.
 * 2. A 2 m target at 0.001 m tolerance refuses a relative error of 0.001;
 *    the same residual on a 100 kg target can pass its own 1 kg budget.
 * 3. Empty systems pass, zero residual at zero tolerance passes, and NaN or
 *    infinity cannot terminate a solve.
 */
export const test_human_body_simple_residual_tolerance = (): void => {
  const row = [{ target: 100, tolerance: 1 }];
  TestValidator.predicate("positive absolute boundary", humanBodySimpleResidualsMet([0.01], row));
  TestValidator.predicate("negative absolute boundary", humanBodySimpleResidualsMet([-0.01], row));
  TestValidator.predicate("adjacent miss refuses", !humanBodySimpleResidualsMet([0.01000001], row));
  TestValidator.predicate("units have independent budgets", !humanBodySimpleResidualsMet(
    [0.001, 0.001], [{ target: 100, tolerance: 1 }, { target: 2, tolerance: 0.001 }],
  ));
  TestValidator.predicate("mass budget alone passes", humanBodySimpleResidualsMet([0.001], row));
  TestValidator.predicate("empty system", humanBodySimpleResidualsMet([], []));
  TestValidator.predicate("exact reading at zero budget", humanBodySimpleResidualsMet(
    [0], [{ target: 2, tolerance: 0 }],
  ));
  for (const value of [NaN, Infinity, -Infinity])
    TestValidator.predicate("nonfinite residual refuses", !humanBodySimpleResidualsMet([value], row));
};
