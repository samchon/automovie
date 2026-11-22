/**
 * A round-off (#3377): a cartwheel that travels along the way the body
 * faced, turns half round about the vertical and lands on both feet at
 * once, facing back where it came from, the entry to a back handspring or
 * a back salto.
 *
 * The body rolls as the cartwheel's wheel (`GymnasticsWheel`): the arms
 * raised wide and the legs straddled over the first `cartwheel.SHAPE`
 * degrees, the lowest spoke bearing at every angle. On the way to the
 * hands it turns a quarter about the vertical through what bears, so the
 * wheel rolls along the heading; past the handstand it turns the second
 * quarter about the bearing hand while the legs close, so both feet come
 * down together, knees bent to take the landing. The roll is one axis and
 * each quarter turn is another, about the vertical, and the two run at once
 * while a quarter is being made (over the wheel's first `ENTRY` degrees and
 * over `SNAP` degrees past the handstand): the posture's heading turns and
 * its roll grows in the same instant, composed as heading then roll, not
 * solved as one rotation about a moving axis (#3416 keeps that multi-axis
 * case).
 *
 * The angle follows minimum-jerk progress over the seconds; nothing is
 * integrated, and no hurdle step, push off the second hand or flight before
 * the landing is shown, a first pass.
 *
 * Events: `handsDown` (the first hand bears), `inverted` (half the wheel),
 * `feetDown` (the feet bear again), `relax` (the end).
 *
 * @evidence contracts/development/common.md#meaningful-documentation lead: The hand that goes down first; `left` when absent. seconds: Seconds the round-off takes; `SECONDS` when absent. Exclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
 * @evidence contracts/development/design.md#principled-representation lead: The hand that goes down first; `left` when absent. seconds: Seconds the round-off takes; `SECONDS` when absent. Exclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: sport/roundOff.ts (roundOff.plan, context).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in roundOff.plan.
 */
export namespace IAutoMovieMotionHumanRoundOff {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The leading hand and the seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The hand is a closed union.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
  export interface IParams {
    /** The hand that goes down first; `left` when absent. */
    lead?: "left" | "right";

    /** Seconds the round-off takes; `SECONDS` when absent ({@link roundOff.SECONDS}, 1.2 s, provisional: quicker than the cartwheel, the entry to a tumbling run).
     * Exclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
     */
    seconds?: number;
  }
}
