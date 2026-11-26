import { AutoMovieEngineMotionSampling } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of the Bézier abscissa's inversion, units of progress. */
const INVERSION: number = 1e-6;

/**
 * `cubicBezierEasing` is the CSS cubic-Bézier easing: the curve from (0, 0) to
 * (1, 1) with control points (x1, y1) and (x2, y2), its ordinate read at the
 * parameter whose abscissa is the progress; `ease` names it.
 *
 * Scenarios:
 *
 * 1. Controls (0, 0) and (1, 0): x(½) = ½, so progress ½ reads y(½) = 3 · ½ · ¼ ·
 *    0 + 3 · ¼ · ½ · 0 + ⅛ = 0.125; the mirrored controls (0, 1) and (1, 1)
 *    read 0.875, the complement; the ends are exact.
 * 2. Controls (1, 0) and (0, 1) at parameter ¾: x = 9/16 and y = 27/32, the
 *    inversion through the stationary abscissa.
 * 3. `cubicBezier` without controls is linear; progress outside [0, 1] is clamped.
 */
export function test_engine_motion_cubic_bezier_easing(): void {
  // 1. Complementary controls.
  const forward = (t: number): number => AutoMovieEngineMotionSampling.cubicBezierEasing([0, 0, 1, 0], t);
  TestValidator.predicate(
    "the half-parameter ordinate and its complement",
    nclose(forward(0.5), 0.125, INVERSION) &&
      nclose(AutoMovieEngineMotionSampling.cubicBezierEasing([0, 1, 1, 1], 0.5), 0.875, INVERSION) &&
      forward(0) === 0 &&
      forward(1) === 1,
  );

  // 2. A stationary abscissa.
  TestValidator.predicate(
    "the inversion through a stationary abscissa",
    nclose(AutoMovieEngineMotionSampling.cubicBezierEasing([1, 0, 0, 1], 9 / 16), 27 / 32, 1e-3),
  );

  // 3. Linear and clamped.
  TestValidator.predicate(
    "linear without controls, clamped outside",
    AutoMovieEngineMotionSampling.ease("cubicBezier", 0.25) === 0.25 &&
      AutoMovieEngineMotionSampling.ease("linear", -1) === 0 &&
      AutoMovieEngineMotionSampling.cubicBezierEasing([0, 0, 1, 1], 2) === 1,
  );
}
