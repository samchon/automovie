import { Vector3 } from "./Vector3";

/**
 * Evaluate one finite orientation-preserving 3×3 deformation Jacobian.
 * Input and returned matrix use row-major order and dimensionless entries.
 * The cofactor matrix is det(J) times inverse(J)-transpose, so it transports
 * oriented area vectors and positive determinant leaves normal direction
 * unchanged by that scalar. No inverse or absolute singularity epsilon is used.
 *
 * This is the arithmetic owner used by createAutoMovieMeshDeformer's normal
 * and face-direction checks. It does not construct a deformation Jacobian,
 * choose a surface's transverse extension, or establish emitted geometry.
 * The consumer still checks every used transported vector and actual cell:
 * cofactor entries can overflow even when the determinant remains finite.
 * Caller arrays are unchanged and the returned object/matrix are owned.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Supplies the shared Jacobian cofactor used to transport a deformation's normals and source face orientation.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Retains the original deformation cofactor arithmetic in one owner; geometry consumers still admit the actual emitted cells.
 * @evidence requirements/asset-authoring/geometry.md#asset-degenerate-geometry-refusal Refuses malformed, nonfinite, singular and orientation-reversing deformation Jacobians without an absolute determinant cutoff.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-model-output-failures Names an unsupported local deformation orientation while leaving used-vector and actual-cell checks with their consumer.
 */
export function cofactorAutoMovieJacobian(jacobian: readonly number[]): {
  determinant: number;
  matrix: number[];
} {
  if (jacobian.length !== 9)
    throw new Error("Mesh Jacobian needs nine row-major entries.");
  for (let index = 0; index < 9; index++)
    if (!Number.isFinite(jacobian[index]))
      throw new Error(
        "Mesh deformation must remain finite and preserve local surface orientation.",
      );
  const a = Vector3.create(jacobian[0], jacobian[3], jacobian[6]);
  const b = Vector3.create(jacobian[1], jacobian[4], jacobian[7]);
  const c = Vector3.create(jacobian[2], jacobian[5], jacobian[8]);
  const bc = Vector3.cross(b, c);
  const ca = Vector3.cross(c, a);
  const ab = Vector3.cross(a, b);
  const determinant = Vector3.dot(a, bc);
  if (!Number.isFinite(determinant) || determinant <= 0)
    throw new Error(
      "Mesh deformation must remain finite and preserve local surface orientation.",
    );
  return {
    determinant,
    matrix: [bc.x, ca.x, ab.x, bc.y, ca.y, ab.y, bc.z, ca.z, ab.z],
  };
}
