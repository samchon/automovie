/**
 * A finite scalar comparison applied to a measured shot-contract fact.
 *
 * @evidence contracts/development/design.md#principled-representation evaluateShotPredicate applies binary64 absolute tolerance symmetrically for equality and widens each inequality: actual at most value plus tolerance or at least value minus tolerance. Expected value, nonnegative tolerance and representable boundary arithmetic are caller premises; finite endpoints alone do not prevent overflow in those sums or differences.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Shared operator, expected scalar and tolerance compose with joint-angle, position and distance measurement arms so comparison semantics have one owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Unresolvable or nonfinite measurements fail with null actual. The evaluator does not independently admit expected values, tolerance or operator strings at runtime, and the retired production contract gate no longer supplies that admission to arbitrary direct callers.
 * @evidence contracts/development/common.md#meaningful-documentation Defines the three operators, selected-measurement units, finite expected value and non-negative absolute tolerance.
 */
export interface IAutoMovieScalarPredicate {
  /** Numeric comparison. */
  operator: "<=" | ">=" | "==";

  /** Finite expected value in the unit implied by the selected predicate. */
  value: number;

  /** Finite non-negative absolute comparison tolerance. */
  tolerance: number;
}
