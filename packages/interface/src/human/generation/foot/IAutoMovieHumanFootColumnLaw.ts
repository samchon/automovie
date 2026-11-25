/**
 * Type contracts exchanged by AutoMovieHumanFootColumnLaw; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanFootColumnLaw {
  /** A column's place along and across the foot, each a law of height. */
  export interface IPlan {
    /**
     * Along-foot position in foot lengths at height measured in
     * lateral-malleolus heights, as consumed by the column and Achilles
     * guides.
     */
    along: (height: number) => number;

    /**
     * Across-foot position in foot breadths at height measured in
     * lateral-malleolus heights, as consumed by the column and Achilles
     * guides.
     */
    across: (height: number) => number;
  }

  /**
   * Result of AutoMovieHumanFootColumnLaw.fit. The least-squares quadratic of
   * values over heights, read at any height; a line through two knots and a
   * constant through one.
   *
   * @param heights The knots' heights.
   * @param values The knots' values at those heights.
   * @returns The law at a height.
   */
  export type FitResult = (height: number) => number;
}
