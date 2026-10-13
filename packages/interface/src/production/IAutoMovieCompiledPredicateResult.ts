import { IAutoMovieShotPredicate } from "./IAutoMovieShotPredicate";

/** One scalar predicate and the value measured by the builder. */
export interface IAutoMovieCompiledPredicateResult {
  /** Exact authoritative predicate. */
  predicate: IAutoMovieShotPredicate;

  /** Actual sampled value, or null when the operand could not be resolved. */
  actual: number | null;

  /** Whether the authoritative comparison passed. */
  passed: boolean;
}
