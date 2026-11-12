import { IAutoMovieMotionHumanAuditMotion } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * The instants an audit check samples between two film seconds: the start,
 * every `1 / rate` after it, and the end itself when the grid does not land
 * on it.
 *
 * Scenarios:
 * 1. From 0 to 1 s at 4 Hz the grid is 0, 0.25, 0.5, 0.75 and 1: five
 *    instants, the end on the grid and not repeated.
 * 2. From 0.1 to 0.45 s at 10 Hz the grid is 0.1, 0.2, 0.3 and 0.4, then 0.45:
 *    an end off the grid is appended, so the last 50 ms are read.
 * 3. A span of zero length is the single instant.
 * 4. At 24 Hz over 2 s the grid has 49 instants and its last is 2 within a
 *    nanosecond, with no duplicate of the end from rounding `48 / 24`.
 * 5. A rate of zero, a negative rate, a rate that is not a number and a span
 *    whose end precedes its start throw.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public grid and reads the instants; a dropped end, a doubled end or an accepted non-positive rate fails.
 * @evidence contracts/development/testing.md#independent-expectations Every instant is `from + i / rate` written out by hand.
 * @evidence contracts/development/testing.md#distinguishing-cases An end on the grid, an end off it, a zero span, a rounding-prone count and each refusal.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit. It runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and lists the 5 scenarios with their numbers.
 */
export function test_motion_audit_grid(): void {
  const grid = IAutoMovieMotionHumanAuditMotion.grid;
  const same = (got: number[], expected: number[]): boolean =>
    got.length === expected.length &&
    got.every(
      (t: number, i: number): boolean => Math.abs(t - expected[i]!) <= 1e-9,
    );

  TestValidator.predicate(
    "an end on the grid is the last instant, once",
    same(grid(0, 1, 4), [0, 0.25, 0.5, 0.75, 1]),
  );
  TestValidator.predicate(
    "an end off the grid is appended",
    same(grid(0.1, 0.45, 10), [0.1, 0.2, 0.3, 0.4, 0.45]),
  );
  TestValidator.predicate(
    "a zero span is one instant",
    same(grid(0.7, 0.7, 24), [0.7]),
  );
  const film: number[] = grid(0, 2, 24);
  TestValidator.equals("two seconds at 24 Hz", film.length, 49);
  TestValidator.predicate(
    "the film's last instant is its end",
    Math.abs(film[48]! - 2) <= 1e-9,
  );

  TestValidator.error("a rate of zero", (): void => {
    grid(0, 1, 0);
  });
  TestValidator.error("a negative rate", (): void => {
    grid(0, 1, -24);
  });
  TestValidator.error("a rate that is not a number", (): void => {
    grid(0, 1, Number.NaN);
  });
  TestValidator.error("a reversed span", (): void => {
    grid(1, 0.5, 24);
  });
}
