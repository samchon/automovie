import { validateRange } from "@automovie/engine";
import type { IAutoMovieConstraintViolation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `validateRange` admits a scalar against independently open or closed
 * endpoints; the default interval is closed and the legacy form is open at the
 * lower end.
 *
 * Scenarios:
 *
 * 1. An open (0, 180) interval refuses 0, 180 and 181 at `$camera` with the
 *    expected text "(0, 180)", and accepts 0.001, 90 and 179.999.
 * 2. The default interval [0, 90] accepts 0 and 90; the legacy open-lower (0, 90]
 *    accepts 90; the refusal texts read "[0, 90]" for -1 and "(0, 90]" for 91.
 * 3. An unbounded maximum accepts the finite value 1 under either upper endpoint
 *    policy.
 */
export function test_unit_engine_validation_range(): void {
  const camera = (value: number): IAutoMovieConstraintViolation[] => {
    const violations: IAutoMovieConstraintViolation[] = [];
    validateRange(value, "$camera", 0, 180, "field", violations, false, false);
    return violations;
  };
  for (const value of [0, 180, 181])
    TestValidator.predicate(
      `open refusal ${value}`,
      camera(value).some(
        (item: IAutoMovieConstraintViolation): boolean =>
          item.path === "$camera" && item.expected.includes("(0, 180)"),
      ),
    );
  for (const value of [0.001, 90, 179.999])
    TestValidator.equals(`open support ${value}`, camera(value), []);
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
    TestValidator.equals(`unbounded ${inclusiveMax}`, unbounded, []);
  }
}
