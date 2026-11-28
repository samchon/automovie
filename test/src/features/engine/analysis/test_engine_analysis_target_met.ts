import { AutoMovieEngineAnalysis } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * `analysisTargetMet` meets an at-least target at or above it and an
 * at-most target at or below it.
 *
 * Scenarios:
 *
 * 1. 300 lx against at-least 300 meets; 299 misses.
 * 2. 0.6 s against at-most 0.6 meets; 0.61 misses.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines inclusive thresholds for at-least and at-most analysis targets.
 * @evidence contracts/development/testing.md#behavioral-verification Compares a measured lux pair and a measured duration pair to corresponding declared targets.
 * @evidence contracts/development/testing.md#independent-expectations At-least 300 includes 300 and misses 299. At-most 0.6 s includes 0.6 and misses 0.61, distinguishing strict and reversed comparisons.
 */
export function test_engine_analysis_target_met(): void {
  TestValidator.equals(
    "at least",
    [
      AutoMovieEngineAnalysis.analysisTargetMet(300, 300, "at-least"),
      AutoMovieEngineAnalysis.analysisTargetMet(299, 300, "at-least"),
    ],
    [true, false],
  );
  TestValidator.equals(
    "at most",
    [
      AutoMovieEngineAnalysis.analysisTargetMet(0.6, 0.6, "at-most"),
      AutoMovieEngineAnalysis.analysisTargetMet(0.61, 0.6, "at-most"),
    ],
    [true, false],
  );
}
