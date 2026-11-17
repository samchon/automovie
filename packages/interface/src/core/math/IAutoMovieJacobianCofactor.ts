/**
 * The determinant and cofactor matrix of one 3×3 deformation Jacobian, as
 * `cofactorAutoMovieJacobian` returns them.
 *
 * The cofactor matrix is `det(J) · J⁻ᵀ`, in row-major order with dimensionless
 * entries, so multiplying an oriented area vector or normal by it gives the
 * deformed one, scaled by the area change. The determinant is finite and
 * positive because the producer refuses an orientation-reversing or
 * non-finite map, but cofactor entries can still overflow. Both values are new
 * and owned by the caller.
 *
 * @evidence contracts/development/design.md#principled-representation Nanson's relation: the cofactor matrix transports oriented area, and with a positive determinant it preserves the side a normal points to; the cofactor columns are cross products of Jacobian columns, so no inverse is formed.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two quantities the mesh deformer's normal and face-direction checks read, returned together because they come from the same three cross products.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A plain result record with no caller-specific field; positivity is a guarantee of the producer, which throws rather than returning a flipped map.
 * @evidence contracts/development/common.md#meaningful-documentation States the formula, storage order, units, what the matrix transports, the determinant guarantee and why, that entries can still overflow, and ownership.
 */
export interface IAutoMovieJacobianCofactor {
  /** Finite positive determinant of the Jacobian. */
  determinant: number;

  /** Nine row-major entries of `det(J) · J⁻ᵀ`; each may overflow to infinity. */
  matrix: number[];
}
