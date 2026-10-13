/**
 * A finite scalar comparison applied to a measured shot-contract fact.
 *
 * @evidence contracts/common.md#principled-implementation evaluateShotPredicate applies absolute tolerance symmetrically for equality and widens the allowed boundary for each inequality: actual at most value plus tolerance or at least value minus tolerance.
 * @evidence contracts/common.md#clear-and-simple-design Shared operator, expected scalar and tolerance compose with joint-angle, position and distance measurement arms so comparison semantics have one owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unresolvable measurements fail with null actual rather than passing a default value; finite expected values and non-negative tolerances are admitted before grading.
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
