import type { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import { Quaternion } from "./Quaternion";

/**
 * Unit quaternion of the rotation whose columns are the orthonormal vectors
 * `x`, `y`, `z` (local axes expressed in world). Shepperd's method: pick the
 * largest diagonal term so the square root never divides by a small number.
 * The result is normalized; the inputs are read only and must already be an
 * orthonormal right-handed frame, which this function does not check.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Converts a constructed orthonormal joint frame into the rotation composable rig geometry consumes.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Selects the numerically stable Shepperd branch so a frame near any axis converts without dividing by a small number.
 * @author Samchon
 */
export function quaternionFromAutoMovieBasis(
  x: IAutoMovieVector3,
  y: IAutoMovieVector3,
  z: IAutoMovieVector3,
): IAutoMovieQuaternion {
  const m00 = x.x,
    m01 = y.x,
    m02 = z.x;
  const m10 = x.y,
    m11 = y.y,
    m12 = z.y;
  const m20 = x.z,
    m21 = y.z,
    m22 = z.z;
  const trace = m00 + m11 + m22;
  let q: IAutoMovieQuaternion;
  if (trace > 0) {
    const s = Math.sqrt(trace + 1) * 2;
    q = {
      w: s / 4,
      x: (m21 - m12) / s,
      y: (m02 - m20) / s,
      z: (m10 - m01) / s,
    };
  } else if (m00 > m11 && m00 > m22) {
    const s = Math.sqrt(1 + m00 - m11 - m22) * 2;
    q = {
      w: (m21 - m12) / s,
      x: s / 4,
      y: (m01 + m10) / s,
      z: (m02 + m20) / s,
    };
  } else if (m11 > m22) {
    const s = Math.sqrt(1 + m11 - m00 - m22) * 2;
    q = {
      w: (m02 - m20) / s,
      x: (m01 + m10) / s,
      y: s / 4,
      z: (m12 + m21) / s,
    };
  } else {
    const s = Math.sqrt(1 + m22 - m00 - m11) * 2;
    q = {
      w: (m10 - m01) / s,
      x: (m02 + m20) / s,
      y: (m12 + m21) / s,
      z: s / 4,
    };
  }
  return Quaternion.normalize(q);
}
