import type { IAutoMovieHumanTrunkSolve } from "./IAutoMovieHumanTrunkSolve";

/**
 * A piece of the shoulders' frontal outline: the left lateral extreme `z` of
 * the body as a function of height `y` over an interval, with its slope and
 * curvature. The outline pieces (the trapezius line, the cap's fillet, the
 * arm's outer edge) join end to end, each publishing the jet its neighbour
 * copies at the shared height.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation A piece of the shoulders' frontal outline: the left lateral extreme `z` of the body as a function of height `y` over an interval, with its slope and curvature.
 * @evidence contracts/development/design.md#principled-representation `from`: Lowest height the piece is defined at, mm. `to`: Highest height the piece is defined at, mm. `at`: The outline at a height inside the interval.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanShoulderCap.create, AutoMovieHumanShoulderLine.create. Also types AutoMovieHumanTrunkSolver.line, AutoMovieHumanTrunkSolver.cap.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `from`, `to`, `at`; callers supply the complete record.
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
  at: (y: number) => IAutoMovieHumanTrunkSolve.IJet;
}
