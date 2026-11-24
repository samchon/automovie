import { bracketedBisection } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * A bracketed bisection returns the end of its final bracket where a
 * yes-or-no condition fails, within the tolerance of the boundary, in the
 * halvings the bracket's width allows and without reading its ends.
 *
 * Scenarios:
 * 1. `x * x < 2` on [0, 2] to 1e-12 returns the square root of two from
 *    above, within the tolerance, in exactly 41 readings, the halvings of a
 *    width of 2 down to 1e-12, none of them at an end.
 * 2. The same condition's mirror, `x * x < 2` holding at 0 and failing at
 *    -2, returns minus the square root of two: the bracket may run backwards.
 * 3. A step condition, `x < 0.3`, whose boundary has no value to interpolate,
 *    returns a point in [0.3, 0.3 + 1e-9].
 * 4. A bracket already no wider than the tolerance returns `high` without a
 *    reading.
 * 5. A non-positive tolerance throws.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public search and compares the returned argument with the boundary and the count of readings with the halvings; a search that returns the end where the condition holds, overshoots the tolerance, reads an end or reads more than the halvings fails.
 * @evidence contracts/development/testing.md#independent-expectations The boundaries are known constants, the square root of two and 0.3; the reading count is ceil(log2(2 / 1e-12)) = 41, computed from the bracket and the tolerance alone.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers a forward bracket, a backward one, a discontinuous condition, a bracket already within the tolerance, and a refused tolerance.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit on closed-form conditions; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 scenarios and what each pins.
 */
export function test_math_bracketed_bisection(): void {
  const read: number[] = [];
  const below = (x: number): boolean => {
    read.push(x);
    return x * x < 2;
  };
  const root: number = bracketedBisection(below, 0, 2, 1e-12);
  TestValidator.predicate(
    "the square root of two from above",
    root >= Math.SQRT2 && root - Math.SQRT2 <= 1e-12,
  );
  TestValidator.equals("the halvings of the bracket", read.length, 41);
  TestValidator.predicate(
    "no end is read",
    read.every((x: number): boolean => x !== 0 && x !== 2),
  );

  const mirrored: number = bracketedBisection(
    (x: number): boolean => x * x < 2,
    0,
    -2,
    1e-12,
  );
  TestValidator.predicate(
    "a backward bracket",
    mirrored <= -Math.SQRT2 && -Math.SQRT2 - mirrored <= 1e-12,
  );

  const step: number = bracketedBisection(
    (x: number): boolean => x < 0.3,
    0,
    1,
    1e-9,
  );
  TestValidator.predicate(
    "a step's boundary",
    step >= 0.3 && step - 0.3 <= 1e-9,
  );

  let calls: number = 0;
  TestValidator.equals(
    "a bracket within the tolerance",
    bracketedBisection(
      (): boolean => {
        calls++;
        return true;
      },
      1,
      1 + 1e-10,
      1e-9,
    ),
    1 + 1e-10,
  );
  TestValidator.equals("read nothing", calls, 0);

  TestValidator.error("zero tolerance", (): unknown =>
    bracketedBisection(below, 0, 2, 0),
  );
}
