import type { AutoMovieVector3Tuple } from "../AutoMovieVector3Tuple";

/**
 * Four cubic Bernstein coefficients in P0, P1, P2, P3 order, in the enclosing
 * field units; P1 and P2 are handles rather than interpolated samples.
 */
export type AutoMovieCubicBezierControls3 = readonly [
  Readonly<AutoMovieVector3Tuple>,
  Readonly<AutoMovieVector3Tuple>,
  Readonly<AutoMovieVector3Tuple>,
  Readonly<AutoMovieVector3Tuple>,
];
