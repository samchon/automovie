import { bracketedBisection } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/predicates";

/**
 * `bracketedBisection` finds the boundary of a yes-or-no condition between two
 * arguments.
 *
 * Scenarios:
 *
 * 1. The condition `x < 2` over [0, 5] with tolerance 1e-6 returns a point in [2,
 *    2 + 1e-6], the end where it does not hold.
 * 2. The bracket may run downward: `x > 2` from 5 to 0 returns a point in [2 -
 *    1e-6, 2].
 * 3. A bracket already within the tolerance returns `high`.
 * 4. A zero tolerance is refused.
 * 5. X * x < 2 on [0, 2] to 1e-12 returns the square root of two from above in
 *    exactly 41 readings, none at an end; the mirrored bracket 0 to -2 returns
 *    minus the square root of two; the step x < 0.3 over [0, 1] to 1e-9 returns
 *    a point in [0.3, 0.3 + 1e-9]; a bracket of width 1e-10 with tolerance 1e-9
 *    returns high with no reading.
 */
export function test_engine_math_bracketed_bisection(): void {
  const up: number = bracketedBisection(
    (x: number): boolean => x < 2,
    0,
    5,
    1e-6,
  );
  TestValidator.predicate("upward", up >= 2 && up <= 2 + 1e-6);
  const down: number = bracketedBisection(
    (x: number): boolean => x > 2,
    5,
    0,
    1e-6,
  );
  TestValidator.predicate("downward", down <= 2 && down >= 2 - 1e-6);
  TestValidator.equals(
    "narrow",
    bracketedBisection((x: number): boolean => x < 1, 0.99, 1.0, 0.5),
    1.0,
  );
  TestValidator.predicate(
    "tolerance",
    throwsError(() => bracketedBisection((): boolean => true, 0, 1, 0)),
  );
  const read: number[] = [];
  const root: number = bracketedBisection(
    (x: number): boolean => {
      read.push(x);
      return x * x < 2;
    },
    0,
    2,
    1e-12,
  );
  TestValidator.predicate(
    "sqrt two from above",
    root >= Math.SQRT2 && root - Math.SQRT2 <= 1e-12,
  );
  TestValidator.equals("halvings", read.length, 41);
  TestValidator.predicate(
    "no end read",
    read.every((x: number): boolean => x !== 0 && x !== 2),
  );
  const mirrored: number = bracketedBisection(
    (x: number): boolean => x * x < 2,
    0,
    -2,
    1e-12,
  );
  TestValidator.predicate(
    "backward",
    mirrored <= -Math.SQRT2 && -Math.SQRT2 - mirrored <= 1e-12,
  );
  const step: number = bracketedBisection(
    (x: number): boolean => x < 0.3,
    0,
    1,
    1e-9,
  );
  TestValidator.predicate("step", step >= 0.3 && step - 0.3 <= 1e-9);
  let calls: number = 0;
  TestValidator.equals(
    "narrow bracket",
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
  TestValidator.equals("no reading", calls, 0);
}
