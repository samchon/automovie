/**
 * Type contracts exchanged by AutoMovieHumanHandStar; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanHandStar {
  /**
   * Result of AutoMovieHumanHandStar.starPoint. A star's `[b, c]` at a station
   * and polar angle, held past its ends.
   */
  export type StarPointResult = [number, number];
}
