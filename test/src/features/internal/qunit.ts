import { type IAutoMovieQuaternion } from "@automovie/interface";

import { nclose } from "./nclose";

/** Check the quaternion Euclidean norm against one. */
export function qunit(q: IAutoMovieQuaternion, eps: number = 1e-6): boolean {
  return nclose(Math.hypot(q.x, q.y, q.z, q.w), 1, eps);
}
