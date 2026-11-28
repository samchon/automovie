import type { AutoMovieVector3Tuple } from "./AutoMovieVector3Tuple";

/**
 * Ordered mutable XYZ control triples for one vector Bernstein polynomial, from
 * first coefficient to last.
 *
 * A nonempty run of n controls represents degree n minus one. Coefficient
 * triples share a Cartesian order and unit chosen by the caller.
 */
export type AutoMovieBernsteinPolynomial64 = AutoMovieVector3Tuple[];
