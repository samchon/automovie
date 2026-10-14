/**
 * A finite scalar comparison applied to a measured shot-contract fact.
 *
 * @evidence contracts/common.md#principled-implementation evaluateShotPredicate applies binary64 absolute tolerance symmetrically for equality and widens each inequality: actual at most value plus tolerance or at least value minus tolerance. Expected value, nonnegative tolerance and representable boundary arithmetic are caller premises; finite endpoints alone do not prevent overflow in those sums or differences.
 * @evidence contracts/common.md#clear-and-simple-design Shared operator, expected scalar and tolerance compose with joint-angle, position and distance measurement arms so comparison semantics have one owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unresolvable or nonfinite measurements fail with null actual. The evaluator does not independently admit expected values, tolerance or operator strings at runtime, and the retired production contract gate no longer supplies that admission to arbitrary direct callers.
 * @evidence contracts/common.md#meaningful-documentation Defines the three operators, selected-measurement units, finite expected value and non-negative absolute tolerance.
 * @author Samchon
 */
export interface IAutoMovieScalarPredicate {
  /** Numeric comparison. */
  operator: "<=" | ">=" | "==";

  /** Finite expected value in the unit implied by the selected predicate. */
  value: number;

  /** Finite non-negative absolute comparison tolerance. */
  tolerance: number;
}
