import { AutoMovieEngineMotionSampling } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of one polynomial. */
const ROUNDING: number = 1e-12;

/**
 * `ease` shapes a clamped progress `t` in [0, 1].
 *
 * Scenarios:
 *
 * 1. Linear is `t`, easeIn is `t^2` (0.25 at 0.5), easeOut is `1 - (1-t)^2` (0.75
 *    at 0.5).
 * 2. EaseInOut is `2t^2` below the middle (0.125 at 0.25) and `1 - (2-2t)^2 / 2`
 *    above it (0.875 at 0.75).
 * 3. Step is 0 until t reaches 1.
 * 4. T outside [0, 1] clamps.
 */
export function test_engine_motion_ease(): void {
  TestValidator.predicate(
    "linear, in and out at the middle",
    nclose(AutoMovieEngineMotionSampling.ease("linear", 0.5), 0.5, ROUNDING) &&
      nclose(AutoMovieEngineMotionSampling.ease("easeIn", 0.5), 0.25, ROUNDING) &&
      nclose(AutoMovieEngineMotionSampling.ease("easeOut", 0.5), 0.75, ROUNDING),
  );
  TestValidator.predicate(
    "in and out",
    nclose(AutoMovieEngineMotionSampling.ease("easeInOut", 0.25), 0.125, ROUNDING) &&
      nclose(AutoMovieEngineMotionSampling.ease("easeInOut", 0.75), 0.875, ROUNDING),
  );
  TestValidator.predicate(
    "step",
    AutoMovieEngineMotionSampling.ease("step", 0.99) === 0 && AutoMovieEngineMotionSampling.ease("step", 1) === 1,
  );
  TestValidator.predicate(
    "clamped",
    AutoMovieEngineMotionSampling.ease("linear", -2) === 0 && AutoMovieEngineMotionSampling.ease("linear", 2) === 1,
  );
}
