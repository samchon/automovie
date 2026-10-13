import { IAutoMovieShotPredicate } from "./IAutoMovieShotPredicate";

/**
 * One authoritative scalar predicate beside its measured value and result. An unresolved operand records null and fails rather than becoming a zero measurement.
 *
 * @evidence contracts/common.md#principled-implementation The builder measures position, Euclidean distance or joint angle at the contract's sample instant and compares the scalar with its authored operator and tolerance; null represents an unavailable operand and cannot pass.
 * @evidence contracts/common.md#clear-and-simple-design Predicate, actual and passed preserve the obligation, observation and decision separately, allowing state and event realization lists to share the same grading representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing rigs, bones or selectors do not become zero-valued measurements, and authored expected values are never copied into actual to manufacture realization.
 * @evidence contracts/common.md#meaningful-documentation Identifies predicate authority, sampled scalar ownership, null unresolved semantics and the resulting failed comparison.
 * @author Samchon
 */
export interface IAutoMovieCompiledPredicateResult {
  /** Exact authoritative predicate. */
  predicate: IAutoMovieShotPredicate;

  /** Actual sampled value, or null when the operand could not be resolved. */
  actual: number | null;

  /** Whether the authoritative comparison passed. */
  passed: boolean;
}
