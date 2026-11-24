import { cubicBezierEasing, ease } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../../features/internal/nclose";
import { throwsError } from "../../../../features/internal/throwsError";

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
  TestValidator.predicate(
    "unnamed controls use linear progress and clamp outside the interval",
    ease("cubicBezier", 0.25) === 0.25 &&
      ease("linear", -1) === 0 &&
      cubicBezierEasing([0, 0, 1, 1], 2) === 1,
  );
  TestValidator.predicate(
    "nonfinite progress refused",
    throwsError(() => ease("linear", NaN)) &&
      throwsError(() => cubicBezierEasing([0, 0, 1, 1], NaN)),
  );
  for (const axis of [0, 1, 2, 3]) {
    const controls: [number, number, number, number] = [0, 0, 1, 1];
    controls[axis] = Infinity;
    TestValidator.predicate(
      "every control coordinate must be finite",
      throwsError(() => cubicBezierEasing(controls, 0.5)),
    );
  }
  // At parameter 3/4 the cubic time coordinate is 9/16 and the easing ordinate is 27/32.
  TestValidator.predicate(
    "inverse through stationary abscissa",
    nclose(cubicBezierEasing([1, 0, 0, 1], 9 / 16), 27 / 32, 1e-3),
  );
  TestValidator.predicate(
    "zero derivative at the entering control",
    nclose(cubicBezierEasing([0, 0, 0, 0], 1e-4), 1e-4, 1e-3),
  );
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
