/**
 * A cartwheel (#3377): the body turns once about its front-to-back axis,
 * sideways, passing from one foot to one hand, the other hand, and the
 * other foot, and stands again a wheel's roll to the side.
 *
 * The body is a wheel of four spokes: the arms raised wide overhead and the
 * legs straddled, held as one rigid shape while it turns. At every angle
 * the spoke that reaches lowest bears, the root's height puts that hand's
 * wrist or that foot's ankle at the height it has when it bears, and the
 * root travels so the bearing joint stays where it came down: a wheel
 * rolling without slipping on its spokes' ends. Nothing is integrated; the
 * turn's angle follows minimum-jerk progress over the cartwheel's seconds.
 * The turn is one axis, the roll, with no pitch and no change of heading.
 *
 * Events: `handsDown` (the first hand bears), `inverted` (half the turn),
 * `feetDown` (the first foot bears again).
 *
 * First pass: the body takes the wheel's shape over the first eighth of the
 * turn and leaves it over the last, while it already bears on a foot, so
 * that foot's joint is kept only as well as the changing shape allows; the
 * hands and the feet are carried by the rigid turn and are not laid flat by
 * a solve; no run-up, no lunge into the first hand and no push off the
 * second are shown. A round-off, a handspring and a vault are not this law:
 * they bend the body between their supports or fly between them.
 *
 * @evidence contracts/development/common.md#meaningful-documentation to: The side the body wheels to; `left` when absent. seconds: Seconds the cartwheel takes; `SECONDS` when absent. Exclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
 * @evidence contracts/development/design.md#principled-representation to: The side the body wheels to; `left` when absent. seconds: Seconds the cartwheel takes; `SECONDS` when absent. Exclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: sport/cartwheel.ts (cartwheel.plan, context).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in cartwheel.plan.
 */
export namespace IAutoMovieMotionHumanCartwheel {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The side, the seconds and the manner.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The side is a closed union.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
  export interface IParams {
    /** The side the body wheels to; `left` when absent. */
    to?: "left" | "right";

    /** Seconds the cartwheel takes; `SECONDS` when absent (`cartwheel.SECONDS`, 1.6 s, provisional: no study of a cartwheel's duration was read).
     * Exclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    seconds?: number;
  }
}
