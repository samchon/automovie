import { type IAutoMovieVector3 } from "@automovie/interface";

import { nclose } from "./nclose";

/** Compare all three vector components with the same absolute tolerance. */
export function vclose(
  v: IAutoMovieVector3,
  e: IAutoMovieVector3,
  eps: number = 1e-6,
): boolean {
  return nclose(v.x, e.x, eps) && nclose(v.y, e.y, eps) && nclose(v.z, e.z, eps);
}
