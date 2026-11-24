import { validateRange } from "@automovie/engine";
import type { IAutoMovieConstraintViolation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Exercise independently open and closed scalar endpoints while preserving
 * finite-value admission and legacy default bounds.
 *
 * Scenarios:
 *
 * 1. An open (0,180) camera interval refuses both endpoints and accepts adjacent
 *    interior values with a matching mathematical diagnostic.
 * 2. The default interval and legacy open-lower (0,90] interval retain upper
 *    equality; the default retains lower equality too.
 * 3. An unbounded maximum accepts finite values under either endpoint policy;
 *    nonfinite observations remain refused.
 */
export function test_unit_engine_validation_range_open_upper(): void {
  const camera: (value: number) => IAutoMovieConstraintViolation[] = (
    value: number,
  ): IAutoMovieConstraintViolation[] => {
    const violations: IAutoMovieConstraintViolation[] = [];
    validateRange(value, "$camera", 0, 180, "field", violations, false, false);
    return violations;
  };
  for (const value of [0, 180, 181])
    TestValidator.predicate(
      "open perspective refusal",
      camera(value).some(
        (item: IAutoMovieConstraintViolation): boolean =>
          item.path === "$camera" && item.expected.includes("(0, 180)"),
      ),
    );
  for (const value of [0.001, 90, 179.999])
    TestValidator.equals("open perspective support", camera(value), []);
  const violations: IAutoMovieConstraintViolation[] = [];
  validateRange(0, "$default", 0, 90, "field", violations);
  validateRange(90, "$default", 0, 90, "field", violations);
  validateRange(90, "$spot", 0, 90, "field", violations, false);
  TestValidator.equals("legacy equalities", violations, []);
  validateRange(-1, "$default", 0, 90, "field", violations);
  TestValidator.predicate(
    "default bracket",
    violations.some((item: IAutoMovieConstraintViolation): boolean =>
      item.expected.includes("[0, 90]"),
    ),
  );
  validateRange(91, "$spot", 0, 90, "field", violations, false);
  TestValidator.predicate(
    "legacy bracket",
    violations.some((item: IAutoMovieConstraintViolation): boolean =>
      item.expected.includes("(0, 90]"),
    ),
  );
  for (const inclusiveMax of [true, false]) {
    const unbounded: IAutoMovieConstraintViolation[] = [];
    validateRange(
      1,
      "$unbounded",
      0,
      Infinity,
      "field",
      unbounded,
      true,
      inclusiveMax,
    );
    TestValidator.equals("unbounded finite support", unbounded, []);
  }
}
