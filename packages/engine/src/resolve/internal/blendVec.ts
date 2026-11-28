import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";

/*
 * Linearly interpolate two vectors by influence `t`.
 *
 * A bounded blend of finite endpoints remains representable even when their
 * difference overflows. Recover only those coordinates after the usual
 * subtraction, scale and addition.
 */
export function blendVec(
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  t: number,
): IAutoMovieVector3 {
  const difference: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(b, a);
  const result: IAutoMovieVector3 = AutoMovieEngineVector3.add(
    a,
    AutoMovieEngineVector3.scale(difference, t),
  );
  if (!(t >= 0 && t <= 1) || AutoMovieEngineVector3.isFinite(difference))
    return result;
  return {
    x: recoverBlend(a.x, b.x, difference.x, result.x, t),
    y: recoverBlend(a.y, b.y, difference.y, result.y, t),
    z: recoverBlend(a.z, b.z, difference.z, result.z, t),
  };
}

function recoverBlend(
  from: number,
  to: number,
  difference: number,
  result: number,
  t: number,
): number {
  return !Number.isFinite(difference) &&
    Number.isFinite(from) &&
    Number.isFinite(to)
    ? (1 - t) * from + t * to
    : result;
}
