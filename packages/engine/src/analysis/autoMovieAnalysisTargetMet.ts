import { AutoMovieAnalysisComparison } from "@automovie/interface";

/**
 * Whether a measured value satisfies a target in the declared direction.
 *
 * `at-least` holds when `value >= target` and `at-most` when `value <= target`,
 * so a value exactly on the target meets it either way. Both numbers are in the
 * same unit; no conversion or tolerance is applied.
 *
 * @param value Finite measured value.
 * @param target Finite target value in the same unit.
 * @param comparison Direction the target is judged in.
 * @returns `true` for `meets`, `false` for `misses`.
 */
export function autoMovieAnalysisTargetMet(
  value: number,
  target: number,
  comparison: AutoMovieAnalysisComparison,
): boolean {
  return comparison === "at-least" ? value >= target : value <= target;
}
