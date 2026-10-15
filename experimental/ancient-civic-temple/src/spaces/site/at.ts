import type { IAutoMovieVector3 } from "@automovie/interface";

export const at = (radius: number, phi: number, height: number): IAutoMovieVector3 => ({
  x: radius * Math.sin(phi), y: height, z: radius * Math.cos(phi),
});
