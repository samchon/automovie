import type { AutoMovieOrderedScalar } from "@automovie/interface";

import { equalOrderedScalars } from "./equalOrderedScalars.js";

/**
 * Compare two ordered lists of scalar rows by value, such as a downmix matrix
 * `[[0.5, 0.5]]`: equal when they have as many rows and each row pair is equal
 * by {@link equalOrderedScalars}.
 *
 * @param left One list of rows.
 * @param right The other.
 * @returns Whether they hold equal rows in the same order.
 */
export const equalOrderedScalarRows: (
  left: readonly (readonly AutoMovieOrderedScalar[])[],
  right: readonly (readonly AutoMovieOrderedScalar[])[],
) => boolean = (
  left: readonly (readonly AutoMovieOrderedScalar[])[],
  right: readonly (readonly AutoMovieOrderedScalar[])[],
): boolean =>
  left.length === right.length &&
  left.every((row: readonly AutoMovieOrderedScalar[], at: number): boolean =>
    equalOrderedScalars(row, right[at]!),
  );
