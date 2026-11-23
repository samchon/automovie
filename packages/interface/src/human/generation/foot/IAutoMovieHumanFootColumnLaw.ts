/**
 * Type contracts exchanged by AutoMovieHumanFootColumnLaw; runtime evaluation remains in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the AutoMovieHumanFootColumnLaw exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.
 * @evidence contracts/development/design.md#principled-representation A type-only namespace groups IPlan, FitResult. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these declarations used by Human's AutoMovieHumanFootColumnLaw; Human retains the computation and source preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace only qualifies the IPlan, FitResult contracts and adds no alternate implementation, optional mode or runtime state.
 */
export namespace IAutoMovieHumanFootColumnLaw {
  /** A column's place along and across the foot, each a law of height.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A column's place along and across the foot, each a law of height.
   * @evidence contracts/development/design.md#principled-representation `along`: Along the foot at a height, foot lengths. `across`: Across the foot at a height, foot breadths.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanFootColumn.law, AutoMovieHumanFootColumnLaw.plan. Also types AutoMovieHumanFootAchilles.law, AutoMovieHumanFootColumn.LAWS.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `along`, `across`; callers supply the complete record.
   */
  export interface IPlan {
    /**
     * Along-foot position in foot lengths at height measured in lateral-malleolus heights, as consumed by the column and Achilles guides.
     */
    along: (height: number) => number;

    /**
     * Across-foot position in foot breadths at height measured in lateral-malleolus heights, as consumed by the column and Achilles guides.
     */
    across: (height: number) => number;
  }

  /** Result of AutoMovieHumanFootColumnLaw.fit. The least-squares quadratic of values over heights, read at any height;
  a line through two knots and a constant through one.
  @param heights The knots' heights.
  @param values The knots' values at those heights.
  @returns The law at a height.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The least-squares quadratic of values over heights, read at any height; a line through two knots and a constant through one.
 * @evidence contracts/development/design.md#principled-representation The least-squares quadratic of values over heights, read at any height; a line through two knots and a constant through one. The callable takes height and returns number.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanFootColumnLaw.FitResult is the canonical exchange used by AutoMovieHumanFootColumnLaw.fit.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanFootColumnLaw.fit for the least-squares quadratic of values over heights, read at any height; a line through two knots and a constant through one.
 */
  export type FitResult = (height: number) => number;
}
