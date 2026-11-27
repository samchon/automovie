import {
  type IAutoMovieJacobianCofactor,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineVector3 } from "../AutoMovieEngineVector3";
import { overflowsBinary64 } from "./overflowsBinary64";

/*
 * Evaluate one finite orientation-preserving 3×3 deformation Jacobian. Input
 * and returned matrix use row-major order and dimensionless entries. The
 * cofactor matrix is det(J) times inverse(J)-transpose, so it transports
 * oriented area vectors and positive determinant leaves normal direction
 * unchanged by that scalar. No inverse or absolute singularity epsilon is
 * used.
 *
 * This is the arithmetic owner used by createAutoMovieMeshDeformer's normal and
 * face-direction checks. It does not construct a deformation Jacobian, choose a
 * surface's transverse extension, or establish emitted geometry. The consumer
 * still checks every used transported vector and actual cell: cofactor entries
 * can overflow even when the determinant remains finite. Caller arrays are
 * unchanged and the returned object/matrix are owned.
 */
export function cofactorAutoMovieJacobian(
  jacobian: readonly number[],
): IAutoMovieJacobianCofactor {
  if (jacobian.length !== 9)
    throw new Error("Mesh Jacobian needs nine row-major entries.");
  const a: IAutoMovieVector3 = AutoMovieEngineVector3.create(
    jacobian[0],
    jacobian[3],
    jacobian[6],
  );
  const b: IAutoMovieVector3 = AutoMovieEngineVector3.create(
    jacobian[1],
    jacobian[4],
    jacobian[7],
  );
  const c: IAutoMovieVector3 = AutoMovieEngineVector3.create(
    jacobian[2],
    jacobian[5],
    jacobian[8],
  );
  const bc: IAutoMovieVector3 = AutoMovieEngineVector3.cross(b, c);
  const ca: IAutoMovieVector3 = AutoMovieEngineVector3.cross(c, a);
  const ab: IAutoMovieVector3 = AutoMovieEngineVector3.cross(a, b);
  const determinant: number = representable(
    representable(representable(a.x * bc.x) + representable(a.y * bc.y)) +
      representable(a.z * bc.z),
  );
  if (!(determinant > 0))
    throw new Error(
      "Mesh deformation must remain finite and preserve local surface orientation.",
    );
  return {
    determinant,
    matrix: [bc.x, ca.x, ab.x, bc.y, ca.y, ab.y, bc.z, ca.z, ab.z],
  };
}

/*
 * One product or sum of the determinant, refused where it overflows binary64.
 */
function representable(result: number): number {
  if (overflowsBinary64(result))
    throw new Error(
      "Mesh deformation must remain finite and preserve local surface orientation.",
    );
  return result;
}
