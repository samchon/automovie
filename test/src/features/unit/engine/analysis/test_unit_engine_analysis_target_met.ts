import { autoMovieAnalysisTargetMet } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `autoMovieAnalysisTargetMet` meets an at-least target at or above it and an
 * at-most target at or below it.
 *
 * Scenarios:
 *
 * 1. 300 lx against at-least 300 meets; 299 misses.
 * 2. 0.6 s against at-most 0.6 meets; 0.61 misses.
 */
export function test_unit_engine_analysis_target_met(): void {
  TestValidator.equals(
    "at least",
    [
      autoMovieAnalysisTargetMet(300, 300, "at-least"),
      autoMovieAnalysisTargetMet(299, 300, "at-least"),
    ],
    [true, false],
  );
  TestValidator.equals(
    "at most",
    [
      autoMovieAnalysisTargetMet(0.6, 0.6, "at-most"),
      autoMovieAnalysisTargetMet(0.61, 0.6, "at-most"),
    ],
    [true, false],
  );
}
