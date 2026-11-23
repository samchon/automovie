import type { AutoMovieVector3Tuple } from "@automovie/interface";

/** Right-handed cross product in the operands' common Cartesian frame. */
export const cross: (
  a: AutoMovieVector3Tuple,
  b: AutoMovieVector3Tuple,
) => AutoMovieVector3Tuple = (
  a: AutoMovieVector3Tuple,
  b: AutoMovieVector3Tuple,
): AutoMovieVector3Tuple => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
