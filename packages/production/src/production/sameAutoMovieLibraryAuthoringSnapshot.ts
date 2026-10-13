import type { IAutoMovieLibraryAuthoringSnapshot } from "./IAutoMovieLibraryAuthoringSnapshot";

/**
 * Compare two independently acquired closures by their canonical digest.
 *
 * @evidence contracts/common.md#principled-implementation Precomputed resident digests compare closures including root and declaration location.
 * @evidence contracts/common.md#clear-and-simple-design Publication uses resident equality while result identity uses the portable projection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Supplied digest fields are trusted; mutated records are not rehashed and collision freedom is not certified.
 * @evidence contracts/common.md#meaningful-documentation States resident versus portable meaning and the unmodified producer-record premise.
 * @evidence contracts/performance.md#efficient-algorithms Fixed-size digest comparison does not traverse sources or design populations.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses acquired digests without a second hash or equality cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a boolean escapes and neither snapshot is retained.
 */
export const sameAutoMovieLibraryAuthoringSnapshot: (left: IAutoMovieLibraryAuthoringSnapshot, right: IAutoMovieLibraryAuthoringSnapshot) => boolean = (left: IAutoMovieLibraryAuthoringSnapshot, right: IAutoMovieLibraryAuthoringSnapshot): boolean => left.digest === right.digest;
