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
     *
     * @evidence contracts/development/common.md#meaningful-documentation Along-foot position in foot lengths at height measured in lateral-malleolus heights, as consumed by the column and Achilles guides.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; the Human producer or supplied callback used by AutoMovieHumanFootColumnLaw owns the numerical method described above.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanFootColumnLaw.IPlan.along declares the invocation boundary only; AutoMovieHumanFootColumnLaw and its callback provider own the implementation decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or substitutions execute in this signature; the Human implementation supplying IAutoMovieHumanFootColumnLaw.IPlan.along must justify them.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; the implementation supplying IAutoMovieHumanFootColumnLaw.IPlan.along owns its time and space costs.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no work coordination; AutoMovieHumanFootColumnLaw and the callback's provider own sharing under the stated input and result contract.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources; the AutoMovieHumanFootColumnLaw producer or caller supplying the callback owns captured state and its lifetime.
     */
    along: (height: number) => number;

    /**
     * Across-foot position in foot breadths at height measured in lateral-malleolus heights, as consumed by the column and Achilles guides.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Across-foot position in foot breadths at height measured in lateral-malleolus heights, as consumed by the column and Achilles guides.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no body; the Human producer or supplied callback used by AutoMovieHumanFootColumnLaw owns the numerical method described above.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanFootColumnLaw.IPlan.across declares the invocation boundary only; AutoMovieHumanFootColumnLaw and its callback provider own the implementation decomposition.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or substitutions execute in this signature; the Human implementation supplying IAutoMovieHumanFootColumnLaw.IPlan.across must justify them.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; the implementation supplying IAutoMovieHumanFootColumnLaw.IPlan.across owns its time and space costs.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no work coordination; AutoMovieHumanFootColumnLaw and the callback's provider own sharing under the stated input and result contract.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources; the AutoMovieHumanFootColumnLaw producer or caller supplying the callback owns captured state and its lifetime.
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
