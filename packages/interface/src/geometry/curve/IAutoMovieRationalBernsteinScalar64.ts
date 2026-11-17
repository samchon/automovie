/**
 * A rational scalar transition N/Q in the same local parameter as its numerator.
 *
 * @evidence contracts/development/design.md#principled-representation A scalar numerator and denominator sharing one local quotient parameter.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One structural record/alias preserves the storage consumed by the neighboring algebra operations.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The type does not admit finite data, positive denominators or a regular geometric surface by itself.
 * @evidence contracts/development/common.md#meaningful-documentation The declaration distinguishes coefficient ordering, parameter correspondence and enclosing value units.
 */
export interface IAutoMovieRationalBernsteinScalar64 {
  /** Homogeneous scalar numerator coefficients. */
  numerator: number[];

  /** Scalar denominator coefficients in the same parameter. */
  denominator: number[];
}
