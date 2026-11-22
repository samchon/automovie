import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";

/**
 * A close strike: the point of the elbow, the back of a spinning fist or the
 * forehead brought onto a target inside the punch's range.
 *
 * - An elbow lands its olecranon with the arm folded past 120 degrees. The
 *   upper arm carries the elbow on a circle about the shoulder, so a target
 *   beyond the upper arm's length from the shoulder, after the trunk's turn
 *   and a half-stance shift of the pelvis, is refused with that band named;
 *   a target at punching range is out of it. `horizontalElbow` sweeps across
 *   the line, `risingElbow` comes up under the target and `descendingElbow`
 *   comes down onto it.
 * - `spinningElbow` and `spinningBackfist` turn the pelvis and trunk through
 *   a whole turn on the ball of the lead foot, the rear foot travelling round
 *   it, and land the rear arm's elbow or the back of its fist as the turn
 *   comes past the opponent.
 * - `headbutt` drives the forehead onto the target by the trunk's lean and a
 *   short shift of the pelvis, the hands holding either side of the
 *   partner's neck when the target is a person, or kept at the guard.
 *
 * No located study gives the delivery times of these strikes: they keep the
 * punch's measured jab delivery (Stanley et al. 2018) and hand recovery,
 * scaled by skill, and a spin adds one more delivery for its turn; all are
 * provisional.
 *
 * @evidence contracts/development/common.md#meaningful-documentation at: What it strikes. technique: The close strike. arm: The striking arm, rear when absent. feint: A share of the delivery shown before the return.
 * @evidence contracts/development/design.md#principled-representation A closed technique union, a target, the arm side and an optional feint share.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the close strike law and its strike rows.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the motion target; the law owns reach refusals.
 */
export namespace IAutoMovieMotionHumanCloseStrike {
  /**
   * The close strikes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the elbows, the spinning strikes and the headbutt.
   * @evidence contracts/development/design.md#principled-representation Explicit literals, each with its effector, path and turn.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the close strike law.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The law owns each technique's geometry.
   */
  export type Technique =
    | "horizontalElbow"
    | "risingElbow"
    | "descendingElbow"
    | "spinningElbow"
    | "spinningBackfist"
    | "headbutt";

  /**
   * The arm that strikes: the stance's lead or rear.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the two arms by the stance.
   * @evidence contracts/development/design.md#principled-representation Two literals relative to the stance's lead.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the close strike law.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The law resolves the side from the entry's stance.
   */
  export type Arm = "lead" | "rear";

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The technique, the target, the arm and a feint share in (0, 1).
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the close strike plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
  export interface IParams {
    /** The close strike. It keeps the punch's timing: 0.405 s from launch to contact at elite skill, 1.06 times at novice, and 0.35 s back to the guard ({@link IAutoMovieMotionHumanPunch}); no study of an elbow's or a headbutt's delivery time was located. GLORY rules ban elbows (`KickboxingRules`). */
    technique: IAutoMovieMotionHumanCloseStrike.Technique;

    /** What it strikes. */
    at: IAutoMovieMotionTarget;

    /** The striking arm; rear when absent. A headbutt strikes with neither. */
    arm?: IAutoMovieMotionHumanCloseStrike.Arm;

    /** A feint: the share of the delivery shown before returning, in (0, 1).
     * Exclusive minimum: 0. Exclusive maximum: 1. Unit: dimensionless.
     */
    feint?: number;
  }
}
