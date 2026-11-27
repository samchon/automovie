/**
 * The determinant and cofactor matrix of one 3×3 deformation Jacobian, as
 * `cofactorAutoMovieJacobian` returns them.
 *
 * The cofactor matrix is `det(J) · J⁻ᵀ`, in row-major order with dimensionless
 * entries, so multiplying an oriented area vector or normal by it gives the
 * deformed one, scaled by the area change. The determinant is finite and
 * positive because the producer refuses an orientation-reversing or non-finite
 * map, but cofactor entries can still overflow. Both values are new and owned
 * by the caller.
 */
export interface IAutoMovieJacobianCofactor {
  /** Finite positive determinant of the Jacobian. */
  determinant: number;

  /** Nine row-major entries of `det(J) · J⁻ᵀ`; each may overflow to infinity. */
  matrix: number[];
}
