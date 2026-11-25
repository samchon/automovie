/**
 * A chord from a join's curve to one rail that varies round the loop: values at
 * uniform curve parameters from 0, read between them by the periodic cubic
 * B-spline through them, so the width law is C2 round the loop.
 *
 * Engine admission: at least four values, each positive.
 */
export interface IAutoMovieConstructionChordTable {
  /** Discriminator. */
  type: "chords";

  /**
   * Chords in metres at the curve parameters `2 pi k / n` from 0, `n` their
   * count, at least four, each positive.
   */
  values: number[];
}
