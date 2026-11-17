import type { AutoMovieOrderedScalar } from "./AutoMovieOrderedScalar.js";

/**
 * One compared position in a speaker-label list or downmix matrix: a number/string scalar or one read-only row of those scalars. equalOrderedScalars compares lengths and order with Object.is, so NaN equals NaN while positive and negative zero differ. Arbitrary objects and deeper nesting are outside this comparison domain.
 *
 * @evidence contracts/development/design.md#principled-representation One compared position in a speaker-label list or downmix matrix: a number/string scalar or one read-only row of those scalars. equalOrderedScalars compares lengths and order with Object.is, so NaN equals NaN while positive and negative zero differ. Arbitrary objects and deeper nesting are outside this comparison domain.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The named operation and its callers share this exact record instead of deriving a type from implementation code.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The documented boundary preserves its producer's admitted values and does not introduce a fallback representation.
 * @evidence contracts/development/common.md#meaningful-documentation Defines the concrete producer, interpretation and failure or comparison semantics.
 */
export type AutoMovieOrderedEntry = AutoMovieOrderedScalar | readonly AutoMovieOrderedScalar[];
