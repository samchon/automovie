import type {
  AutoMovieOrderedEntry,
  AutoMovieOrderedScalar,
} from "@automovie/interface";

/**
 * Compare ordered arrays of scalars, or of arrays of scalars, by value.
 *
 * The domain is exactly what `validWaveAudioIdentity` compares: a speaker-label
 * array such as `["front-left", "front-right"]` and a one-row downmix matrix
 * such as `[[0.5, 0.5]]`. Arrays are equal when they have the same length and
 * every position holds equal scalars, or rows of the same length with equal
 * scalars; order and the scalar's type both count. `Object.is` decides each
 * scalar, so `NaN` equals `NaN` and `+0` differs from `-0`.
 *
 * Nesting deeper than one row, prototypes, symbol keys, boxed primitives and
 * cycles are outside the domain.
 */
export const equalOrderedScalars: (
  left: readonly AutoMovieOrderedEntry[],
  right: readonly AutoMovieOrderedEntry[],
) => boolean = (
  left: readonly AutoMovieOrderedEntry[],
  right: readonly AutoMovieOrderedEntry[],
): boolean => {
  if (left.length !== right.length) return false;
  for (let at: number = 0; at < left.length; ++at) {
    const one: AutoMovieOrderedEntry = left[at]!;
    const other: AutoMovieOrderedEntry = right[at]!;
    // A row is the entry union's object member; a scalar is a number or text.
    if (typeof one === "object" || typeof other === "object") {
      if (typeof one !== "object" || typeof other !== "object") return false;
      const row: readonly AutoMovieOrderedScalar[] = one;
      const otherRow: readonly AutoMovieOrderedScalar[] = other;
      if (row.length !== otherRow.length) return false;
      for (let inner: number = 0; inner < row.length; ++inner)
        if (Object.is(row[inner], otherRow[inner]) === false) return false;
      continue;
    }
    if (Object.is(one, other) === false) return false;
  }
  return true;
};
