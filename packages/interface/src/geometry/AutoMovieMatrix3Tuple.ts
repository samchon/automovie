import type { AutoMovieVector3Tuple } from "./AutoMovieVector3Tuple";

/**
 * Dimensionless three-by-three linear mapping, stored as three mutable rows.
 * Multiplication acts on a column vector. Rotation consumers additionally
 * require orthonormal rows and determinant +1; the tuple does not enforce these
 * premises or finite entries. Admission belongs to each numerical operation.
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
   */
  export type ReadonlyRows = readonly [
    Readonly<AutoMovieVector3Tuple>,
    Readonly<AutoMovieVector3Tuple>,
    Readonly<AutoMovieVector3Tuple>,
  ];
}
