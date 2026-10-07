import type { IAutoMovieTransform } from "@automovie/interface";

/** Preserve the original staging yaw about world positive Y. */
export const createFilmFacadeYaw = (deg: number): IAutoMovieTransform["rotation"] => ({
  x: 0,
  y: Math.sin(((deg / 2) * Math.PI) / 180),
  z: 0,
  w: Math.cos(((deg / 2) * Math.PI) / 180),
});
