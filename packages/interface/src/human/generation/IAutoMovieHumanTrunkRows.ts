/** Type contracts exchanged by AutoMovieHumanTrunkRows; runtime evaluation remains in Human. */
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
