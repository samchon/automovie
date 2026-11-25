/**
 * Type contracts exchanged by AutoMovieHumanFootToeRoot; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanFootToeRoot {
  /**
   * The depth argument of AutoMovieHumanFootToeRoot.of. The first section's
   * length along a toe's line, mm.
   *
   * @param breadth The toe's line and breadth.
   * @param clefts The toe's clefts, left frame.
   * @param depth The toe's half depth at a length along its line, mm.
   * @param cap The toe's cap length.
   */
  export type OfDepth = (s: number) => number;
}
