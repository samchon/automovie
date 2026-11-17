/**
 * Type contracts exchanged by AutoMovieHumanTrunkRows; runtime evaluation remains in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the AutoMovieHumanTrunkRows exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.
 * @evidence contracts/development/design.md#principled-representation A type-only namespace groups StationsSpacing. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these declarations used by Human's AutoMovieHumanTrunkRows; Human retains the computation and source preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace only qualifies the StationsSpacing contracts and adds no alternate implementation, optional mode or runtime state.
 */
export namespace IAutoMovieHumanTrunkRows {
  /** The spacing argument of AutoMovieHumanTrunkRows.stations. The rows of a chain from its first station to its last.
  @param from The chain's first station, mm.
  @param to The chain's last station, mm.
  @param marks Landmark stations to keep, mm, in any order; those outside `(from, to)` are ignored.
  @param spacing The spacing allowed at a station, mm: the rule of the chain, capped at `MAX_GAP`.
  @returns Strictly rising stations from `from` to `to`.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The rows of a chain from its first station to its last.
 * @evidence contracts/development/design.md#principled-representation The rows of a chain from its first station to its last. The callable takes y and returns number.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanTrunkRows.StationsSpacing is the canonical exchange used by AutoMovieHumanTrunkRows.stations.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanTrunkRows.stations for the rows of a chain from its first station to its last.
 */
  export type StationsSpacing = (y: number) => number;
}
