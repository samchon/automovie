import { validateRange } from "@automovie/engine";
import type { IAutoMovieConstraintViolation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Numeric admission can express an open perspective interval while retaining
 * the inclusive upper bound required by existing light and scalar contracts.
 *
 * Scenarios:
 *
 * 1. An open (0, 180) camera interval refuses both endpoints and accepts its
 *    adjacent interior values with a matching mathematical diagnostic.
 * 2. The default interval and a legacy open-lower (0, 90] interval retain
 *    equality at the upper endpoint; the default retains lower equality too.
 * 3. An unbounded maximum accepts finite values under either endpoint policy;
 *    nonfinite or wrongly typed observations remain refused.
 */
export const test_validation_range_open_upper = (): void => {
  const camera = (value: unknown): IAutoMovieConstraintViolation[] => {
    const violations: IAutoMovieConstraintViolation[] = [];
    validateRange(value, "$camera", 0, 180, "field", violations, false, false);
    return violations;
  };
  for (const value of [0, 180, 181, NaN, Infinity, "90"])
    TestValidator.predicate("open perspective refusal", camera(value).some((item) => item.path === "$camera" && item.expected.includes("(0, 180)")));
  for (const value of [0.001, 90, 179.999])
    TestValidator.equals("open perspective support", camera(value), []);
  const violations: IAutoMovieConstraintViolation[] = [];
  validateRange(0, "$default", 0, 90, "field", violations);
  validateRange(90, "$default", 0, 90, "field", violations);
  validateRange(90, "$spot", 0, 90, "field", violations, false);
  TestValidator.equals("legacy equalities", violations, []);
  validateRange(-1, "$default", 0, 90, "field", violations);
  TestValidator.predicate("default bracket", violations.some((item) => item.expected.includes("[0, 90]")));
  validateRange(91, "$spot", 0, 90, "field", violations, false);
  TestValidator.predicate("legacy bracket", violations.some((item) => item.expected.includes("(0, 90]")));
  for (const inclusiveMax of [true, false]) {
    const unbounded: IAutoMovieConstraintViolation[] = [];
    validateRange(1, "$unbounded", 0, Infinity, "field", unbounded, true, inclusiveMax);
    TestValidator.equals("unbounded finite support", unbounded, []);
    validateRange(Infinity, "$unbounded", 0, Infinity, "field", unbounded, false, inclusiveMax);
    TestValidator.predicate("unbounded finite refusal", unbounded.some((item) => item.path === "$unbounded" && item.expected.includes("> 0")));
  }
};
