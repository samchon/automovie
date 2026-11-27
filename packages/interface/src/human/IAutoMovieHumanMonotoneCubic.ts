/**
 * Readonly abscissa/value knot pairs supplied to monotone interpolation.
 * Runtime construction and admission remain with AutoMovieHumanMonotoneCubic in
 * Human.
 */
export namespace IAutoMovieHumanMonotoneCubic {
  /**
   * Borrowed [abscissa, value] pairs, at least one, in any order. Units belong
   * to the caller's scalar quantities; the interpolation caller also chooses
   * any minimum abscissa spacing.
   */
  export type InterpolateKnots = readonly (readonly [number, number])[];
}
