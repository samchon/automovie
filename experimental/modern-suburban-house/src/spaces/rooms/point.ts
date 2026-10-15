import type { IAutoMovieVector3 } from "@automovie/interface";


/** Vector from its three components. */
export const point = (x: number, y: number, z: number): IAutoMovieVector3 => ({
  x,
  y,
  z,
});
