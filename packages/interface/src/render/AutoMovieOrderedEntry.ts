import type { AutoMovieOrderedScalar } from "./AutoMovieOrderedScalar";

/**
 * One compared position in a speaker-label list or downmix matrix: a
 * number/string scalar or one read-only row of those scalars.
 * equalOrderedScalars compares lengths and order with Object.is, so NaN equals
 * NaN while positive and negative zero differ. Arbitrary objects and deeper
 * nesting are outside this comparison domain.
 */
export type AutoMovieOrderedEntry =
  | AutoMovieOrderedScalar
  | readonly AutoMovieOrderedScalar[];
