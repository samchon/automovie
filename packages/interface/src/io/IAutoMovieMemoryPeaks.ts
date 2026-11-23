/**
 * Componentwise maxima of host-observed used heap and resident bytes during a
 * run. The host chooses sample times and initializes the accumulator; the two
 * maxima need not occur at the same instant. Unobserved inter-sample peaks are
 * unknown.
 */

export interface IAutoMovieMemoryPeaks {
  /** Observed managed heap peak in bytes. */
  heap: number;

  /** Observed resident memory peak in bytes. */
  rss: number;
}
