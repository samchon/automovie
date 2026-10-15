import type { IAutoMovieVector3 } from "@automovie/interface";


/** Cross product of two vectors. */
export const cross = (a: IAutoMovieVector3, b: IAutoMovieVector3): IAutoMovieVector3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});
