import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";
import { Quaternion } from "./Quaternion";
/**
 * Unit quaternion of the rotation whose columns are the orthonormal vectors
 * `x`, `y`, `z` (local axes expressed in world). Shepperd's method: pick the
 * largest diagonal term so the square root never divides by a small number.
 * The result is normalized; the inputs are read only and must already be an
 * orthonormal right-handed frame, which this function does not check.
 *
 * @evidence contracts/common.md#principled-implementation Trace/largest-diagonal Shepperd extraction followed by normalization recovers a rotation from caller-admitted right-handed orthonormal columns, without claiming arbitrary columns form a frame.
 * @evidence contracts/common.md#clear-and-simple-design One basis conversion serves deformation and inspection frames without importing renderer matrix classes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Input columns are not orthogonalized or reflected to force a result, and no model identity changes branch selection.
 * @evidence contracts/common.md#meaningful-documentation States world-space local-axis columns, orthonormal/right-handed prerequisite, extraction purpose, normalized glTF quaternion and unchanged inputs.
 * @evidence contracts/performance.md#efficient-algorithms Nine entries, one selected square root and one normalization take constant work without allocating a matrix.
 * @evidence contracts/performance.md#reuse-equivalent-work Column coordinates feed one extraction directly; a changed frame requires a fresh quaternion rather than a cached basis reading.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Scalar entries and one temporary quaternion are local; the returned normalized record keeps no column references.
 * @author Samchon
 */
export function quaternionFromAutoMovieBasis(
  x: IAutoMovieVector3,
  y: IAutoMovieVector3,
  z: IAutoMovieVector3,
): IAutoMovieQuaternion {
  const m00: number = x.x,
    m01: number = y.x,
    m02: number = z.x;
  const m10: number = x.y,
    m11: number = y.y,
    m12: number = z.y;
  const m20: number = x.z,
    m21: number = y.z,
    m22: number = z.z;
  const trace: number = m00 + m11 + m22;
  let q: IAutoMovieQuaternion;
  if (trace > 0) {
    const s: number = Math.sqrt(trace + 1) * 2;
    q = {
      w: s / 4,
      x: (m21 - m12) / s,
      y: (m02 - m20) / s,
      z: (m10 - m01) / s,
    };
  } else if (m00 > m11 && m00 > m22) {
    const s: number = Math.sqrt(1 + m00 - m11 - m22) * 2;
    q = {
      w: (m21 - m12) / s,
      x: s / 4,
      y: (m01 + m10) / s,
      z: (m02 + m20) / s,
    };
  } else if (m11 > m22) {
    const s: number = Math.sqrt(1 + m11 - m00 - m22) * 2;
    q = {
      w: (m02 - m20) / s,
      x: (m01 + m10) / s,
      y: s / 4,
      z: (m12 + m21) / s,
    };
  } else {
    const s: number = Math.sqrt(1 + m22 - m00 - m11) * 2;
    q = {
      w: (m10 - m01) / s,
      x: (m02 + m20) / s,
      y: (m12 + m21) / s,
      z: s / 4,
    };
  }
  return Quaternion.normalize(q);
}
