import { AutoMovieEngineValidation } from "@automovie/engine";
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
 * 4. Unbounded endpoints preserve the full finite scalar range. Infinities
 *    and NaN produce one located diagnostic with the authored value.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers open and closed scalar bounds, interval text, finite values at machine extremes, and refusal of infinities and NaN under unbounded endpoints.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `validateRange` with explicit and default inclusivity. It checks rejection paths, diagnostic text, and preserved values, including each non-finite input when both bounds are infinite.
 * @evidence contracts/development/testing.md#independent-expectations The finite endpoints distinguish open from closed. Values -1 and 91 lie outside [0, 90]. Zero and both signed MAX_VALUE values lie inside an unbounded finite domain, and neither infinity nor NaN belongs there.
 */
export function test_engine_validation_range(): void {
  const camera = (value: number): IAutoMovieConstraintViolation[] => {
    const violations: IAutoMovieConstraintViolation[] = [];
    AutoMovieEngineValidation.validateRange(value, "$camera", 0, 180, "field", violations, false, false);
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
  AutoMovieEngineValidation.validateRange(0, "$default", 0, 90, "field", violations);
  AutoMovieEngineValidation.validateRange(90, "$default", 0, 90, "field", violations);
  AutoMovieEngineValidation.validateRange(90, "$spot", 0, 90, "field", violations, false);
  TestValidator.equals("legacy equalities", violations, []);
  AutoMovieEngineValidation.validateRange(-1, "$default", 0, 90, "field", violations);
  TestValidator.predicate(
    "default bracket",
    violations.some((item: IAutoMovieConstraintViolation): boolean =>
      item.expected.includes("[0, 90]"),
    ),
  );
  AutoMovieEngineValidation.validateRange(91, "$spot", 0, 90, "field", violations, false);
  TestValidator.predicate(
    "legacy bracket",
    violations.some((item: IAutoMovieConstraintViolation): boolean =>
      item.expected.includes("(0, 90]"),
    ),
  );
  for (const inclusiveMax of [true, false]) {
    const unbounded: IAutoMovieConstraintViolation[] = [];
    AutoMovieEngineValidation.validateRange(
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
  for (const [inclusiveMin, inclusiveMax] of [
    [true, true],
    [false, false],
  ] as const)
    for (const [value, admitted] of [
      [-Number.MAX_VALUE, true],
      [0, true],
      [Number.MAX_VALUE, true],
      [-Infinity, false],
      [Infinity, false],
      [NaN, false],
    ] as const) {
      const findings: IAutoMovieConstraintViolation[] = [];
      AutoMovieEngineValidation.validateRange(
        value,
        "$finite",
        -Infinity,
        Infinity,
        "field",
        findings,
        inclusiveMin,
        inclusiveMax,
      );
      const row: IAutoMovieConstraintViolation | undefined = findings[0];
      TestValidator.predicate(
        `finite range ${value} with inclusive endpoints ${inclusiveMin}`,
        admitted
          ? findings.length === 0
          : findings.length === 1 &&
            row?.kind === "range" &&
            row.severity === "error" &&
            row.path === "$finite" &&
            row.expected ===
              `field must be finite and ${inclusiveMin ? ">=" : ">"} -Infinity, but was ${value}` &&
            Object.is(row.value, value),
      );
    }
}
