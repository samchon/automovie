import { bracketedMinimum } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../../../internal/predicates";

/**
 * `bracketedMinimum` finds the least point of a one-variable function on an
 * interval by Brent's method.
 *
 * Scenarios:
 *
 * 1. (x - 0.3)^2 on [0, 1] has its least at 0.3 with value 0, found within 1e-4
 *    whichever end is passed first.
 * 2. |x - 0.7| (a kink) on [0, 1] is found at 0.7 within 1e-4.
 * 3. A zero tolerance is refused.
 */
export function test_unit_engine_math_bracketed_minimum(): void {
  const a = bracketedMinimum((x: number): number => (x - 0.3) ** 2, 0, 1, 1e-9);
  TestValidator.predicate(
    "parabola",
    nclose(a.at, 0.3, 1e-4) && nclose(a.value, 0, 1e-8),
  );
  const b = bracketedMinimum((x: number): number => (x - 0.3) ** 2, 1, 0, 1e-9);
  TestValidator.predicate("reversed ends", nclose(b.at, 0.3, 1e-4));
  const kink = bracketedMinimum(
    (x: number): number => Math.abs(x - 0.7),
    0,
    1,
    1e-9,
  );
  TestValidator.predicate("kink", nclose(kink.at, 0.7, 1e-4));
  TestValidator.predicate(
    "tolerance",
    throwsError(() => bracketedMinimum((x: number): number => x, 0, 1, 0)),
  );
}
