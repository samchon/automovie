import type { AutoMovieVector3Tuple } from "@automovie/interface";

/*
 * Euclidean inner product; units are the product of the operands' units.
 */
export const dot: (
  a: AutoMovieVector3Tuple,
  b: AutoMovieVector3Tuple,
) => number = (a: AutoMovieVector3Tuple, b: AutoMovieVector3Tuple): number =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
