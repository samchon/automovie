/**
 * Bouncing on a trampoline (#4006): straight bounces that build toward an
 * apex, a shape held at each flight's apex, and a kill that absorbs the
 * last landing to a stop.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the bounces, the shapes and the kill.
 * @evidence contracts/development/design.md#principled-representation The bed, the count, the apex and the shape.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: exercise/trampolineBounce.ts (trampolineBounce.plan).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly.
 */
export namespace IAutoMovieMotionHumanTrampoline {
  /**
   * The shape held at a flight's apex.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Straight, or the tuck, the pike or the straddle jump.
   * @evidence contracts/development/design.md#principled-representation Closed choices "straight", "tuck", "pike", "straddle".
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: exercise/trampolineBounce.ts (trampolineBounce.SHAPES).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly.
   */
  export type Shape = "straight" | "tuck" | "pike" | "straddle";

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, unit, range and default.
   * @evidence contracts/development/design.md#principled-representation The trampoline by scene id, a whole bounce count, the apex as the feet's height above the bed in metres, and the apex shape.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The four members trampolineBounce.plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: every member applies to every bounce; an apex beyond the legs' push remains for the law's runtime refusal.
   */
  export interface IParams {
    /** The trampoline's scene id; the jumper stands on its bed as the action starts. */
    on: string;

    /** How many bounces, a whole number of at least 1; 4 when absent. */
    bounces?: number;

    /** The apex the bounces build toward, the feet's height above the bed, metres, positive; 1 when absent. Refused beyond what the legs' push can sustain. */
    apex?: number;

    /** The shape held at each apex; `straight` when absent. */
    shape?: Shape;
  }
}
