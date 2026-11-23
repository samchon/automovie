import type { AutoMovieVector3Tuple } from "@automovie/interface";

/** Euclidean vector magnitude, retaining the operand's units. */
export const len: (a: AutoMovieVector3Tuple) => number = (
  a: AutoMovieVector3Tuple,
): number => Math.hypot(a[0], a[1], a[2]);
