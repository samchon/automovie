import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieJacobianCofactor } from "./IAutoMovieJacobianCofactor";
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
 * @evidence contracts/common.md#principled-implementation Column cross products form the cofactor matrix and their scalar triple product gives the determinant; positive finite determinant admission preserves orientation without matrix inversion.
 * @evidence contracts/common.md#clear-and-simple-design The mesh deformer consumes one shared determinant/cofactor pair for transported normals and face checks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No determinant epsilon erases small positive maps; consumers still check transported vectors because cofactors can overflow.
 * @evidence contracts/common.md#meaningful-documentation States row-major dimensionless layout, oriented-area transport, determinant admission, ownership and possible cofactor overflow.
 * @evidence contracts/performance.md#efficient-algorithms Nine checks and three fixed cross products take constant time, without iterative inversion or dimension-dependent storage.
 * @evidence contracts/performance.md#reuse-equivalent-work The same cross products supply both determinant and cofactor output, avoiding another determinant calculation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Column and cross-product records are temporary; the caller owns the returned nine-entry matrix and determinant.
 */
export function cofactorAutoMovieJacobian(
  jacobian: readonly number[],
): IAutoMovieJacobianCofactor {
  if (jacobian.length !== 9)
    throw new Error("Mesh Jacobian needs nine row-major entries.");
  for (let index: number = 0; index < 9; index++)
    if (!Number.isFinite(jacobian[index]))
      throw new Error(
        "Mesh deformation must remain finite and preserve local surface orientation.",
      );
  const a: IAutoMovieVector3 = Vector3.create(
    jacobian[0],
    jacobian[3],
    jacobian[6],
  );
  const b: IAutoMovieVector3 = Vector3.create(
    jacobian[1],
    jacobian[4],
    jacobian[7],
  );
  const c: IAutoMovieVector3 = Vector3.create(
    jacobian[2],
    jacobian[5],
    jacobian[8],
  );
  const bc: IAutoMovieVector3 = Vector3.cross(b, c);
  const ca: IAutoMovieVector3 = Vector3.cross(c, a);
  const ab: IAutoMovieVector3 = Vector3.cross(a, b);
  const determinant: number = Vector3.dot(a, bc);
  if (!Number.isFinite(determinant) || determinant <= 0)
    throw new Error(
      "Mesh deformation must remain finite and preserve local surface orientation.",
    );
  return {
    determinant,
    matrix: [bc.x, ca.x, ab.x, bc.y, ca.y, ab.y, bc.z, ca.z, ab.z],
  };
}
