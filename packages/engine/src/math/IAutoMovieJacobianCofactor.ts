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
 * @evidence contracts/common.md#principled-implementation Nanson's relation: the cofactor matrix transports oriented area, and with a positive determinant it preserves the side a normal points to; the cofactor columns are cross products of Jacobian columns, so no inverse is formed.
 * @evidence contracts/common.md#clear-and-simple-design The two quantities the mesh deformer's normal and face-direction checks read, returned together because they come from the same three cross products.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A plain result record with no caller-specific field; positivity is a guarantee of the producer, which throws rather than returning a flipped map.
 * @evidence contracts/common.md#meaningful-documentation States the formula, storage order, units, what the matrix transports, the determinant guarantee and why, that entries can still overflow, and ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A result record with no algorithm; the evaluation is answered on `cofactorAutoMovieJacobian`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The determinant and cofactor share one Jacobian evaluation; consumers reuse this pair only while applying that unchanged local deformation map.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources One number and a nine-entry array owned by the caller.
 */
export interface IAutoMovieJacobianCofactor {
  /** Finite positive determinant of the Jacobian. */
  determinant: number;

  /** Nine row-major entries of `det(J) · J⁻ᵀ`; each may overflow to infinity. */
  matrix: number[];
}
