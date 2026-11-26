import { IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";

/** Linearly interpolate two vectors by influence `t`. */
export function blendVec(
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  t: number,
): IAutoMovieVector3 {
  return Vector3.add(a, Vector3.scale(Vector3.subtract(b, a), t));
}
