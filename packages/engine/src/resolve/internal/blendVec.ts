import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";

/*
 * Linearly interpolate two vectors by influence `t`.
 */
export function blendVec(
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  t: number,
): IAutoMovieVector3 {
  return AutoMovieEngineVector3.add(a, AutoMovieEngineVector3.scale(AutoMovieEngineVector3.subtract(b, a), t));
}
