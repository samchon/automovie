import { cubicBezierEasing } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";

/**
 * Mirrored Bézier controls produce complementary progress.
 *
 * Scenarios:
 * 1. Compare the interior observation and boundary state with the prescribed continuous law.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Mirrored Bézier controls produce complementary progress.
 * @evidence contracts/development/testing.md#independent-expectations At parameter one half the symmetric abscissa is one half; the last Bernstein weight is one eighth.
 * @evidence contracts/development/testing.md#distinguishing-cases Boundary and interior inputs distinguish the two behaviors.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_dynamics_easing_curve(): void {
  const forward = (t: number): number => cubicBezierEasing([0, 0, 1, 0], t);
  const reverse = (t: number): number => cubicBezierEasing([0, 1, 1, 1], t);
  TestValidator.predicate(
    "half-parameter cubic ordinate",
    nclose(forward(0.5), 0.125, 1e-6),
  );
  TestValidator.predicate(
    "reflected controls",
    nclose(reverse(0.5), 0.875, 1e-6),
  );
  TestValidator.predicate(
    "exact endpoints",
    forward(0) === 0 && forward(1) === 1,
  );
  TestValidator.predicate(
    "nonfinite coordinate refused",
    throwsError(() => cubicBezierEasing([0, NaN, 1, 1], 0.5)),
  );
}
