import type { IAutoMovieShotPredicate } from "./IAutoMovieShotPredicate";

/**
 * One authoritative scalar predicate beside its measured value and result. An
 * unresolved operand records null and fails rather than becoming a zero
 * measurement.
 */
export interface IAutoMovieCompiledPredicateResult {
  /** Exact authoritative predicate. */
  predicate: IAutoMovieShotPredicate;

  /** Actual sampled value, or null when the operand could not be resolved. */
  actual: number | null;

  /** Whether the authoritative comparison passed. */
  passed: boolean;
}
