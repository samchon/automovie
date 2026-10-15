import type { IAutoMovieVector3 } from "@automovie/interface";


/** Difference `a - b` of two vectors. */
export const sub = (a: IAutoMovieVector3, b: IAutoMovieVector3): IAutoMovieVector3 => ({
  x: a.x - b.x,
  y: a.y - b.y,
  z: a.z - b.z,
});
