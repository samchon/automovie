/**
 * Ordered walk-station and girth pairs in millimetres, with held end values.
 * Runtime construction and admission remain with AutoMovieHumanArmGirth in
 * Human.
 */
export namespace IAutoMovieHumanArmGirth {
  /**
   * Ordered [walk station, girth] pairs in millimetres. A shared span boundary
   * appears once.
   */
  export type KnotsResult = [number, number][];

  /**
   * Borrowed [walk station, girth] knots in increasing station order, both in
   * millimetres. The reader holds the first and last girths outside the knot
   * interval.
   */
  export type AtList = readonly [number, number][];
}
