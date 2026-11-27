import type { IAutoMovieQuaternion } from "@automovie/interface";

import { readNormalizedQuaternion } from "./readNormalizedQuaternion";

/*
 * Read inverse(a) * b's geodesic angle through the original scalar arithmetic.
 * afterNormalization first performs the separate normalize(a) boundary used by
 * actual chain errors. Both entries retain inverse's conjugate normalization
 * and the Hamilton/atan2 formula; neither constructs an intermediate
 * quaternion.
 */
export function readQuaternionAngle(
  a: IAutoMovieQuaternion,
  b: IAutoMovieQuaternion,
): number {
  return readNormalizedQuaternion.fromScalars(
    -a.x,
    -a.y,
    -a.z,
    a.w,
    relativeAngle,
    b,
  );
}

/*
 * A separate first normalization followed by the same relative-angle reading.
 */
export namespace readQuaternionAngle {
  /*
   * Normalize a first, then read the same angle; b is read only afterward.
   */
  export function afterNormalization(
    a: IAutoMovieQuaternion,
    b: IAutoMovieQuaternion,
  ): number {
    return readNormalizedQuaternion(a, normalizedFirst, b);
  }
}

/*
 * Transfer the completed first normalization into the original inverse
 * boundary.
 */
function normalizedFirst(
  x: number,
  y: number,
  z: number,
  w: number,
  _raw: IAutoMovieQuaternion,
  b: IAutoMovieQuaternion,
): number {
  return readNormalizedQuaternion.fromScalars(-x, -y, -z, w, relativeAngle, b);
}

/*
 * Original Hamilton component association and stable relative-angle formula.
 */
function relativeAngle(
  ax: number,
  ay: number,
  az: number,
  aw: number,
  b: IAutoMovieQuaternion,
): number {
  const x: number = aw * b.x + ax * b.w + ay * b.z - az * b.y;
  const y: number = aw * b.y - ax * b.z + ay * b.w + az * b.x;
  const z: number = aw * b.z + ax * b.y - ay * b.x + az * b.w;
  const w: number = aw * b.w - ax * b.x - ay * b.y - az * b.z;
  return 2 * Math.atan2(Math.hypot(x, y, z), Math.abs(w));
}
