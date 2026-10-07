/**
 * Determinant and cofactor matrix of one 3×3 deformation Jacobian.
 *
 * The cofactor matrix is det(J) times inverse(J)-transpose in row-major
 * order with dimensionless entries, so it transports oriented area vectors.
 * The determinant is finite and positive for an orientation-preserving map.
 * Both values are owned by the caller.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Names the shared Jacobian cofactor used to transport a deformation's normals and source face orientation.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Carries the original deformation cofactor arithmetic from its one owner to geometry consumers.
 * @author Samchon
 */
export interface IAutoMovieJacobianCofactor {
  /**
   * Finite positive determinant of the Jacobian.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Reports the local volume scale of a composable deformation.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Admits only orientation-preserving local deformations.
   */
  determinant: number;

  /**
   * Nine row-major cofactor entries, det(J) times inverse(J)-transpose.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Transports normals and face directions through the deformation.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Leaves used-vector and actual-cell checks to the consuming deformer.
   */
  matrix: number[];
}
