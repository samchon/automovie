/**
 * Fighting-stance footwork: steps that keep the stance, the foot on the side
 * of travel moving first and the other following to restore the stance
 * without crossing (IBA coaching manual pp. 36 to 39: forward, the lead foot
 * then the rear; back, the rear then the lead; sideways, the near foot then
 * the far).
 *
 * Each step moves the whole stance by its length along the direction in the
 * body's line frame: the first foot swings in the first half of the step, the
 * second follows in the second, each on a minimum-jerk path lifted clear of
 * the floor, while the root carries the body on its own minimum-jerk profile
 * and the guard rides on the trunk. The step length defaults to half a
 * stance length (the kickboxing research's step share) and the step period to
 * 0.35 s, about three steps a second, inside the 2 to 3.5 steps a second of
 * the ring-movement reading (provisional).
 *
 * @evidence contracts/development/common.md#meaningful-documentation steps: How many steps; 1 when absent. Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas. length: Each step's length, metres; half a stance length when absent.
 * @evidence contracts/development/design.md#principled-representation steps: How many steps; 1 when absent. Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas. length: Each step's length, metres; half a stance length when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: chain/HumanChainStriking.ts (HumanChainStriking.step, params); striking/step.ts (step.plan, context); striking/step.ts (step.plan).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in HumanChainStriking.step.
 */
export namespace IAutoMovieMotionHumanStep {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame, unit and default.
   * @evidence contracts/development/design.md#principled-representation A closed union of directions in the stance's frame, a whole step count and a length in metres, both checked when planning.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The three values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
  export interface IParams {
    /** The direction in the stance's own frame. */
    direction: "forward" | "back" | "left" | "right";

    /** How many steps; 1 when absent.
     * Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    steps?: number;

    /** Each step's length, metres; half a stance length when absent. */
    length?: number;
  }
}
