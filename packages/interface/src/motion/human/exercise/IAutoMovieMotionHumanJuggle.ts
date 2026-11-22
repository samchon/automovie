/**
 * Toss juggling (#3997): the cascade, an odd number of balls each thrown
 * from inside to the other hand and caught on the outside, and the shower,
 * the balls travelling round, thrown high from one hand and passed low back
 * from the other. Shannon's juggling theorem binds the pattern:
 * `(F + D) H = (V + D) N` for flight `F`, dwell `D` and vacancy `V` per
 * hand, `H` hands and `N` balls.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the patterns and the theorem.
 * @evidence contracts/development/design.md#principled-representation A pattern, its balls and its height.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: exercise/juggle.ts (juggle.plan).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly.
 */
export namespace IAutoMovieMotionHumanJuggle {
  /**
   * The patterns.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The patterns' names.
   * @evidence contracts/development/design.md#principled-representation Closed choices "cascade", "shower".
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: exercise/juggle.ts (juggle.plan).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly.
   */
  export type Pattern = "cascade" | "shower";

  /**
   * Parameters.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
  export interface IParams {
    /** The pattern. */
    pattern: Pattern;

    /** The balls' scene ids, resting at the hands' start points (`juggle.start`): the first in the right hand, the second in the left, any third on top of the first. */
    balls: string[];

    /** How high the throws rise above the hands, metres; 0.6 when absent. Gravity decides the flight, `sqrt(8 h / g)` between hands level with each other (g 9.80665 m/s2): 0.70 s at 0.6 m. The hold times follow from the flight by Shannon's theorem at a dwell ratio of 0.75 (`juggle.DWELL`, Beek and Lewbel 1995), so a higher throw is slower in every beat; a vacancy under `juggle.VACANCY` (0.12 s) is refused.
     * Exclusive minimum: 0. Unit: "m". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    height?: number;

    /** How many throws; three for each ball when absent.
     * Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    throws?: number;

    /** Balls dropped: the throw counts (from 1) whose ball is not caught and falls to the floor. */
    drops?: number[];
  }
}
