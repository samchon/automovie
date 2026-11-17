import type { AutoMovieVector3Tuple } from "./AutoMovieVector3Tuple";

/**
 * Dimensionless three-by-three linear mapping, stored as three mutable rows.
 * Multiplication acts on a column vector. Rotation consumers additionally
 * require orthonormal rows and determinant +1; the tuple does not enforce
 * these premises or finite entries. Admission belongs to each numerical operation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States row order, multiplication convention, mutability and the separate rotation and finite-number premises.
 * @evidence contracts/development/design.md#principled-representation Three fixed rows of three dimensionless numbers preserve matrix dimensions; tuple shape cannot certify orthogonality or numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns the matrix exchanged by Human segment-frame arithmetic and engine Curve64 transformations; their particular transform restrictions remain at those operations.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A concrete tuple replaces no runtime library object. ReadonlyRows preserves the same layout for borrowed input without claiming runtime freezing.
 */
export type AutoMovieMatrix3Tuple = [
  AutoMovieVector3Tuple,
  AutoMovieVector3Tuple,
  AutoMovieVector3Tuple,
];

/**
 * Access views of the same row-major matrix. Curve64 borrows readonly rows;
 * Human arithmetic produces mutable matrices. These views change neither the
 * representation nor its numeric premises and allocate no runtime wrapper.
 */
export namespace AutoMovieMatrix3Tuple {
  /**
   * Borrowed matrix with readonly access to its outer tuple and each row.
   * Another alias may mutate its storage; no clone or freeze is implied.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both readonly tuple levels and the absence of ownership or runtime immutability guarantees.
   * @evidence contracts/development/design.md#principled-representation Three readonly rows retain dimensionless coefficients and fixed three-by-three arity; numerical validity remains the caller's responsibility.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Engine Curve64 transformations borrow the matrix layout also produced by Human segment-frame arithmetic.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Readonly is an access restriction rather than a second matrix concept or hidden immutable allocation.
   */
  export type ReadonlyRows = readonly [
    Readonly<AutoMovieVector3Tuple>,
    Readonly<AutoMovieVector3Tuple>,
    Readonly<AutoMovieVector3Tuple>,
  ];
}
