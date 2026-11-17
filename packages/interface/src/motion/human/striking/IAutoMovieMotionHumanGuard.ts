import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";

/**
 * The fighting stance taken and held: from whatever the performer stands in,
 * each foot steps to its stance place in turn (the rear foot first, so the
 * lead foot stays a support), the root sinks until both knees soften and
 * turns to the stance heading, and the gloves come up to the guard, then the
 * stance holds with a light bounce through the knees.
 *
 * The stance itself is {@link StrikingStance}: measured on the body, so any
 * stature takes its own. A foot already within 1 cm of its place stays
 * planted. The line faces the `facing` target when one is given (read at
 * the start), otherwise it keeps the entry's line: a performer already in a
 * stance keeps its line, and one standing square faces straight ahead.
 *
 * The bounce: kickboxers keep a rhythmic bounce between exchanges; its
 * height is a third of the stance's sink and its rate two bounces a second,
 * provisional readings of coaching footage (the kickboxing research's
 * rhythm share) with no located measurement.
 *
 * @evidence contracts/development/common.md#meaningful-documentation seconds: How long, seconds; 1 when absent and at least the 0.6 s the stance takes to set. stance: Which side leads; the entry's leading side when absent. facing: What to face; the entry's line when absent.
 * @evidence contracts/development/design.md#principled-representation seconds: How long, seconds; 1 when absent and at least the 0.6 s the stance takes to set. stance: Which side leads; the entry's leading side when absent. facing: What to face; the entry's line when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: chain/HumanChainStriking.ts (HumanChainStriking.guard, params); striking/guard.ts (guard.plan, context); striking/guard.ts (guard.build, context); striking/guard.ts (guard.blendArms, context).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionTarget identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanGuard {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit, minimum or default.
   * @evidence contracts/development/design.md#principled-representation A duration in seconds (raised to the setting time when planning), a closed union of stances, and the interface's motion target to face.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The three values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface's target union.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
  export interface IParams {
    /** How long, seconds; 1 when absent and at least the 0.6 s the stance takes to set. */
    seconds?: number;

    /** Which side leads; the entry's leading side when absent. */
    stance?: "orthodox" | "southpaw";

    /** What to face; the entry's line when absent. */
    facing?: IAutoMovieMotionTarget;
  }
}
