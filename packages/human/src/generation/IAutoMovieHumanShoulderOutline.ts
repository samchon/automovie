import type { AutoMovieHumanTrunkSolve } from "./AutoMovieHumanTrunkSolve";

/**
 * A piece of the shoulders' frontal outline: the left lateral extreme `z` of
 * the body as a function of height `y` over an interval, with its slope and
 * curvature. The outline pieces (the trapezius line, the cap's fillet, the
 * arm's outer edge) join end to end, each publishing the jet its neighbour
 * copies at the shared height.
 */
export interface IAutoMovieHumanShoulderOutline {
  /** Lowest height the piece is defined at, mm. */
  from: number;

  /** Highest height the piece is defined at, mm. */
  to: number;

  /**
   * The outline at a height inside the interval.
   *
   * @param y Height, mm.
   * @returns The lateral extreme in `value` (mm), its slope in mm per mm and its curvature in mm per mm squared.
   */
  at: (y: number) => AutoMovieHumanTrunkSolve.IJet;
}
