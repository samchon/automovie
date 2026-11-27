/*
 * The largest magnitude a 4 by 4 matrix element may have for the operations the
 * cameras run on it, a determinant and an inverse, to stay inside binary64.
 *
 * A 4 by 4 determinant is a sum of 24 products of four elements, so with every
 * element at most `L` it is at most `24 * L^4`; that stays at or below the
 * largest double exactly when `L <= (MAX_VALUE / 24)^(1/4)`. An element beyond
 * it, an infinity or a NaN, names no matrix these operations can use.
 */
export const AUTOMOVIE_MATRIX_ELEMENT_LIMIT: number =
  (Number.MAX_VALUE / 24) ** 0.25;