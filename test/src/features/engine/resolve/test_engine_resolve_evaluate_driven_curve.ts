import { evaluateDrivenCurve } from "@automovie/engine";
import type { IAutoMovieDrivenCurve } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of one linear interpolation. */
const ROUNDING: number = 1e-12;

/** Output 0 at source 0, 10 at source 1, 4 at source 3. */
const CURVE: IAutoMovieDrivenCurve = {
  points: [
    { source: 0, output: 0 },
    { source: 1, output: 10 },
    { source: 3, output: 4 },
  ],
};

/**
 * `evaluateDrivenCurve` maps a source value through a piecewise linear curve,
 * holding the end outputs outside the first and last point.
 *
 * Scenarios:
 *
 * 1. Between two points the output is linear: source 0.5 gives 5 and source 2
 *    gives 7.
 * 2. A point's own source gives its output.
 * 3. Below the first and above the last source the end output holds.
 * 4. An absent source reads the first point.
 */
export function test_engine_resolve_evaluate_driven_curve(): void {
  TestValidator.predicate(
    "linear between points",
    nclose(evaluateDrivenCurve(0.5, CURVE), 5, ROUNDING) &&
      nclose(evaluateDrivenCurve(2, CURVE), 7, ROUNDING),
  );
  TestValidator.predicate(
    "at a point",
    nclose(evaluateDrivenCurve(1, CURVE), 10, ROUNDING),
  );
  TestValidator.predicate(
    "held outside",
    evaluateDrivenCurve(-5, CURVE) === 0 && evaluateDrivenCurve(9, CURVE) === 4,
  );
  TestValidator.predicate(
    "an absent source reads the first point",
    evaluateDrivenCurve(undefined, CURVE) === 0,
  );
}
