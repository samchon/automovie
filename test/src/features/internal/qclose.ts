import { type IAutoMovieQuaternion } from "@automovie/interface";

/** Compare unit quaternion rotations up to sign with their absolute dot product. */
export function qclose(
  q: IAutoMovieQuaternion,
  e: IAutoMovieQuaternion,
  eps: number = 1e-6,
): boolean {
  const dot: number = q.x * e.x + q.y * e.y + q.z * e.z + q.w * e.w;
  return Math.abs(Math.abs(dot) - 1) <= eps;
}
