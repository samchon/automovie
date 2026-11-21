import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * A walk along a line too narrow for a normal gait (#3875 beam, #3997
 * tightrope): the feet step heel to toe on the line, each turned out from
 * it, the arms held out to the sides, and the body sways over the line and
 * corrects (`lineWalk`).
 *
 * The line is a prop's: a beam's `surface` runs along its depth, a rope's
 * or a bar's `bar` along its length. A walk that would leave the line, or a
 * line narrower than the foot's grip on it, is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation on: The prop and its affordance the line runs along. to: Where along the line the walk stops, world metres. steps: How many steps; the fewest heel-to-toe steps that reach `to` when absent.
 * @evidence contracts/development/design.md#principled-representation on: A scene id and an affordance id. to: A world point projected on the line. steps: A positive whole number.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: exercise/lineWalk.ts (lineWalk.plan, context); lexicon/HumanGymnastics.ts (HumanGymnastics.lineWalk, params).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No step length is authored: it is the foot's.
 */
export namespace IAutoMovieMotionHumanLineWalk {
  /**
   * The line walked on.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both members.
   * @evidence contracts/development/design.md#principled-representation A scene id and one of its affordance ids.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The two ids the plan resolves.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IOn {
    /** Scene id of the beam, rope or bar. */
    prop: string;

    /** Its affordance the line runs along: a `surface` along its depth or a `bar` along its length; `surface` when absent. */
    affordance?: string;
  }

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The line, the stopping point and an optional step count.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The step count is derived unless authored.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and support refusals.
   */
  export interface IParams {
    /** The line walked on. */
    on: IAutoMovieMotionHumanLineWalk.IOn;

    /** Where along the line the walk stops, world metres; projected on the line. */
    to: IAutoMovieVector3;

    /** How many steps; the fewest heel-to-toe steps that reach `to` when absent.
     * Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    steps?: number;
  }
}
