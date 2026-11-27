/** One glare kernel as the final pass blurs it. */
export interface IAutoMovieFilmGlareKernel {
  /** The kernel's share of the spread energy. */
  weight: number;

  /** Pyramid level blurred at: the frame reduced by `2^level` on each side. */
  level: number;

  /**
   * Standard deviation in level pixels after the pyramid's own blur is
   * subtracted.
   */
  deviation: number;

  /**
   * Separable tap weights at whole level-pixel offsets, centre first; the
   * centre plus twice the rest sums to one.
   */
  weights: number[];
}