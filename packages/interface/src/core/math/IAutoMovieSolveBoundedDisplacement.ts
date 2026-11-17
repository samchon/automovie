import type { IAutoMovieQuadraticRow } from "./IAutoMovieQuadraticRow";

/** Data and callback contracts shared by the SolveBoundedDisplacement operations. */
export namespace IAutoMovieSolveBoundedDisplacement {
  /**
   * Minimum squared nonnegative travel under box caps and every supplied affine condition.
   *
   * solveAutoMovieBoundedDisplacement admits the full quadratic problem before selecting constraints. It adds each group's worst unsatisfied row in deterministic input order, checks every original row after each solve, and throws on numerical refusal, exhausted rounds or an unsatisfied already-selected system. Geometry, mass interpretation and numerical scaling belong to the caller.
   *
   * @evidence contracts/development/design.md#principled-representation Positive diagonal masses define 1/2 sum(mass[i]*travel[i]²), while upper and every affine row bound the same variable vector.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Group ids select the work schedule without changing the complete feasible set or objective.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Tolerance is an absolute numerical row error, not permission to drop a contact or change its bound.
   * @evidence contracts/development/common.md#meaningful-documentation States variable alignment, caller-owned physical units, full admission, deterministic grouping and failure behavior.
   */
  export type IInput = {
    /** Strictly positive finite objective weights, one per travel coordinate; these are caller-supplied weights, not necessarily kilograms. */
    mass: readonly number[];
    /** Finite nonnegative travel cap for each coordinate, in that coordinate's caller-chosen displacement unit; length equals mass.length. */
    upper: readonly number[];
    /** All affine contact conditions, borrowed without mutation; an empty set returns the exact zero travel optimum after admission. */
    constraints: readonly {
      /** Original affine interval row over travel coordinates; all coefficients and bounds pass the shared quadratic admission. */
      row: IAutoMovieQuadraticRow;
      /** Map identity used to add one worst unsatisfied row per group each round; no integer or geometry meaning is inferred from this number. */
      group: number;
    }[];
    /** Finite positive absolute maximum row-bound violation accepted on the returned vector, in the supplied rows' numerical units. */
    tolerance: number;
    /** Positive safe-integer limit on restricted solves; an unresolved problem at that count throws instead of returning partial travel. */
    maximumRounds: number;
  };
  /**
   * Admitted displacement and the complete-row measurement that accepted it.
   *
   * The returned travel has been clipped to each exact [0, upper] box and then checked against every original row. Uninvolved coordinates retain the exact zero optimum. No result is returned for a failed numerical solve or an exhausted work budget.
   *
   * @evidence contracts/development/design.md#principled-representation The accepted vector and its maximum original-row violation publish the same full-system feasibility decision used by the solver.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Round count and last numerical status explain whether the exact zero start or restricted numerical work produced the accepted vector.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A null status identifies the already-feasible zero start; it does not hide an unsuccessful numerical attempt.
   * @evidence contracts/development/common.md#meaningful-documentation Specifies clipping, units, full-row admission, empty-work behavior and refusal rather than partial publication.
   */
  export type IResult = {
    /** Caller-owned displacement vector in original coordinate order, with 0 <= travel[i] <= upper[i] and every row within tolerance. */
    travel: number[];
    /** Maximum nonnegative bound violation over every original affine row on the exact returned travel, in row-value units. */
    violation: number;
    /** Number of restricted numerical solves completed; zero when the all-zero unconstrained optimum already satisfies every row. */
    rounds: number;
    /** Last admitted quadratic status, 1 after numerical work, or null when the zero start was accepted without calling the numerical solver. */
    status: number | null;
  };
}
