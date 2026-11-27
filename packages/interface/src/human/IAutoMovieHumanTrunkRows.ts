/**
 * Type contracts exchanged by AutoMovieHumanTrunkRows; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanTrunkRows {
  /**
   * The spacing argument of AutoMovieHumanTrunkRows.stations. The rows of a
   * chain from its first station to its last.
   *
   * @param from The chain's first station, mm.
   * @param to The chain's last station, mm.
   * @param marks Landmark stations to keep, mm, in any order; those outside
   *   `(from, to)` are ignored.
   * @param spacing The spacing allowed at a station, mm: the rule of the
   *   chain, capped at `MAX_GAP`.
   * @returns Strictly rising stations from `from` to `to`.
   */
  export type StationsSpacing = (y: number) => number;
}
