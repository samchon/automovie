import type { IAutoMovieVector3 } from "@automovie/interface";

/** Apply the existing expected root multiplier componentwise to a source contact. */
export const mapped: (
  v: IAutoMovieVector3,
  scale: number,
) => IAutoMovieVector3 = (
  v: IAutoMovieVector3,
  scale: number,
): IAutoMovieVector3 => ({
  x: v.x * scale,
  y: v.y * scale,
  z: v.z * scale,
});
