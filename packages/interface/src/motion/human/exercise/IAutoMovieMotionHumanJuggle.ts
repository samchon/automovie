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
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, unit, range and default, and the height states how the flight and holds follow from it.
   * @evidence contracts/development/design.md#principled-representation The pattern, the balls by scene id in hand order, the throw height in metres, the throw count and the dropped throws by one-based count.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The members juggle.plan reads; the timing is derived from the height by Shannon's theorem, not supplied.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The ball count each pattern admits and a too-short vacancy are not encoded in the type and remain for juggle.plan's runtime refusals.
   */
  export interface IParams {
    /** The pattern. */
    pattern: Pattern;

    /** The balls' scene ids, resting at the hands' start points (`juggle.start`): the first in the right hand, the second in the left, any third on top of the first. */
    balls: string[];

    /** How high the throws rise above the hands, metres, positive; 0.6 when absent. Gravity decides the flight, `sqrt(8 h / g)` between hands level with each other (g 9.80665 m/s2): 0.70 s at 0.6 m. The hold times follow from the flight by Shannon's theorem at a dwell ratio of 0.75 (`juggle.DWELL`, Beek and Lewbel 1995), so a higher throw is slower in every beat; a vacancy under `juggle.VACANCY` (0.12 s) is refused. */
    height?: number;

    /** How many throws, a whole number of at least 1; three for each ball when absent. */
    throws?: number;

    /** Balls dropped: the throw counts (from 1) whose ball is not caught and falls to the floor. */
    drops?: number[];
  }
}
