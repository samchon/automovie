import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/** The rotation vector taking one unit orientation to a later one, in its frame. */
export const rotationLogarithm: (
  at: IAutoMovieQuaternion,
  later: IAutoMovieQuaternion,
) => IAutoMovieVector3 = (
  at: IAutoMovieQuaternion,
  later: IAutoMovieQuaternion,
): IAutoMovieVector3 => {
  const x: number =
    at.w * later.x - at.x * later.w - at.y * later.z + at.z * later.y;
  const y: number =
    at.w * later.y + at.x * later.z - at.y * later.w - at.z * later.x;
  const z: number =
    at.w * later.z - at.x * later.y + at.y * later.x - at.z * later.w;
  const w: number =
    at.w * later.w + at.x * later.x + at.y * later.y + at.z * later.z;
  const sine: number = Math.hypot(x, y, z);
  const factor: number =
    (w < 0 ? -1 : 1) *
    (sine === 0 ? 2 : (2 * Math.atan2(sine, Math.abs(w))) / sine);
  return { x: factor * x, y: factor * y, z: factor * z };
};
