/**
 * Type contracts exchanged by AutoMovieHumanFootToeRoot; runtime evaluation remains in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the AutoMovieHumanFootToeRoot exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.
 * @evidence contracts/development/design.md#principled-representation A type-only namespace groups OfDepth. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these declarations used by Human's AutoMovieHumanFootToeRoot; Human retains the computation and source preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace only qualifies the OfDepth contracts and adds no alternate implementation, optional mode or runtime state.
 */
export namespace IAutoMovieHumanFootToeRoot {
  /** The depth argument of AutoMovieHumanFootToeRoot.of. The first section's length along a toe's line, mm.
  @param breadth The toe's line and breadth.
  @param clefts The toe's clefts, left frame.
  @param depth The toe's half depth at a length along its line, mm.
  @param cap The toe's cap length.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The first section's length along a toe's line, mm.
 * @evidence contracts/development/design.md#principled-representation The first section's length along a toe's line, mm. The callable takes s and returns number.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanFootToeRoot.OfDepth is the canonical exchange used by AutoMovieHumanFootToeRoot.of.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanFootToeRoot.of for the first section's length along a toe's line, mm.
 */
  export type OfDepth = (s: number) => number;
}
