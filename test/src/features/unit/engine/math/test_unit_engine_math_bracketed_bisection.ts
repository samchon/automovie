import { bracketedBisection } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../../../internal/predicates";

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
 */
export function test_unit_engine_math_bracketed_bisection(): void {
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
}
