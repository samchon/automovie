/**
 * Determinant and cofactor matrix of one 3×3 deformation Jacobian.
 *
 * The cofactor matrix is det(J) times inverse(J)-transpose in row-major
 * order with dimensionless entries, so it transports oriented area vectors.
 * The determinant is finite and positive for an orientation-preserving map.
 * Both values are owned by the caller.
 *
 * @author Samchon
 */
export interface IAutoMovieJacobianCofactor {
  /** Finite positive determinant of the Jacobian. */
  determinant: number;

  /** Nine row-major cofactor entries, det(J) times inverse(J)-transpose. */
  matrix: number[];
}
