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
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and support refusals.
   */
  export interface IParams {
    /** The trampoline's scene id; the jumper stands on its bed as the action starts. */
    on: string;

    /** How many bounces; 4 when absent.
     * Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    bounces?: number;

    /** The apex the bounces build toward, the feet's height above the bed, metres; 1 when absent. Refused beyond what the legs' push can sustain.
     * Exclusive minimum: 0. Unit: "m". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    apex?: number;

    /** The shape held at each apex; `straight` when absent. */
    shape?: Shape;
  }
}
