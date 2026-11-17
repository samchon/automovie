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
   *
   * @evidence contracts/development/common.md#meaningful-documentation The outline at a height inside the interval.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or compensations execute in this signature. AutoMovieHumanShoulderCap and AutoMovieHumanShoulderGirdle and the callback provider must satisfy the documented at contract.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature chooses no algorithm or storage strategy; AutoMovieHumanShoulderCap and AutoMovieHumanShoulderGirdle and its callback provider own the cost of each at invocation.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no requests or caching. AutoMovieHumanShoulderCap and AutoMovieHumanShoulderGirdle and the callback provider determine when the inputs to at describe equivalent work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources. AutoMovieHumanShoulderCap and AutoMovieHumanShoulderGirdle and the callback provider own any captured source data and the callable's lifetime.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This is the IAutoMovieHumanShoulderOutline.at callable contract, without an implementation body. AutoMovieHumanShoulderCap and AutoMovieHumanShoulderGirdle and its supplied callbacks own the numerical method and admission of the documented arguments.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanShoulderOutline.at declares only the invocation boundary; decomposition belongs to AutoMovieHumanShoulderCap and AutoMovieHumanShoulderGirdle and the callback provider.
   */
  at: (y: number) => IAutoMovieHumanTrunkSolve.IJet;
}
