import type { AutoMovieOrderedScalar } from "@automovie/interface";

/**
 * Compare two ordered lists of scalars by value, such as speaker-label lists
 * `["front-left", "front-right"]`: equal when they have the same length and
 * every position holds the same scalar by `Object.is`, so the scalar's type
 * counts, `NaN` equals `NaN` and `+0` differs from `-0`.
 *
 * @param left One list.
 * @param right The other.
 * @returns Whether they hold the same scalars in the same order.
 */
export const equalOrderedScalars: (
  left: readonly AutoMovieOrderedScalar[],
  right: readonly AutoMovieOrderedScalar[],
) => boolean = (
  left: readonly AutoMovieOrderedScalar[],
  right: readonly AutoMovieOrderedScalar[],
): boolean =>
  left.length === right.length &&
  left.every((value: AutoMovieOrderedScalar, at: number): boolean =>
    Object.is(value, right[at]),
  );
