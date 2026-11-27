import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../Quaternion";
import { readBasisQuaternion } from "./readBasisQuaternion";

/*
 * Unit quaternion of the rotation whose columns are the orthonormal vectors
 * `x`, `y`, `z` (local axes expressed in world). Shepperd's method: pick the
 * largest diagonal term so the square root never divides by a small number. The
 * result is normalized; the inputs are read only and must already be an
 * orthonormal right-handed frame, which this function does not check.
 */
export function quaternionFromAutoMovieBasis(
  x: IAutoMovieVector3,
  y: IAutoMovieVector3,
  z: IAutoMovieVector3,
): IAutoMovieQuaternion {
  return readBasisQuaternion(
    x.x,
    x.y,
    x.z,
    y.x,
    y.y,
    y.z,
    z.x,
    z.y,
    z.z,
    normalizedRecord,
    undefined,
  );
}

/*
 * Own and normalize the completed basis quaternion in glTF component order.
 */
function normalizedRecord(
  x: number,
  y: number,
  z: number,
  w: number,
): IAutoMovieQuaternion {
  return Quaternion.normalize({ x, y, z, w });
}
