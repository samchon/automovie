import type { AutoMovieVector3Tuple } from "@automovie/interface";

/*
 * Scales a vector by a scalar without changing its frame.
 */
export const mul: (
  a: AutoMovieVector3Tuple,
  scale: number,
) => AutoMovieVector3Tuple = (
  a: AutoMovieVector3Tuple,
  scale: number,
): AutoMovieVector3Tuple => [a[0] * scale, a[1] * scale, a[2] * scale];
