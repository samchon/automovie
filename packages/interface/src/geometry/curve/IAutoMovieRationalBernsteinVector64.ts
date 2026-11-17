import type { AutoMovieBernsteinPolynomial64 } from "./AutoMovieBernsteinPolynomial64";

/**
   * A rational vector field N/Q; the denominator must remain positive on the evaluated chart.
   *
   * @evidence contracts/development/design.md#principled-representation A vector homogeneous numerator and scalar denominator sharing one local quotient parameter.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One structural record/alias preserves the storage consumed by the neighboring algebra operations.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The type does not admit finite data, positive denominators or a regular geometric surface by itself.
   * @evidence contracts/development/common.md#meaningful-documentation The declaration distinguishes coefficient ordering, parameter correspondence and enclosing value units.
   */
  export interface IAutoMovieRationalBernsteinVector64 {
    /** Homogeneous vector numerator coefficients. */
    numerator: AutoMovieBernsteinPolynomial64;

    /** Scalar denominator coefficients in the same parameter. */
    denominator: number[];
  }
