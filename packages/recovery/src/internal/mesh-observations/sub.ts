import type { AutoMovieVector3Tuple } from "@automovie/interface";

/*
 * Subtracts vectors expressed in the same frame and units.
 */
export const sub: (
  a: AutoMovieVector3Tuple,
  b: AutoMovieVector3Tuple,
) => AutoMovieVector3Tuple = (
  a: AutoMovieVector3Tuple,
  b: AutoMovieVector3Tuple,
): AutoMovieVector3Tuple => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
