import type { IAutoMovieVector3 } from "@automovie/interface";

/** Make an owned vector from its three components. */
export function createVector3(x: number, y: number, z: number): IAutoMovieVector3 {
  return { x, y, z };
}
