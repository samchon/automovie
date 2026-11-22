/**
 * A broken base (kuzushi): the receiver of a judo throw drawn off balance
 * forward, the whole body tipped about the ankles over the toes while the
 * feet stay on the floor, the stage before a throw carries the body over.
 *
 * The body turns as one about the midpoint of its two ankles by `depth`
 * degrees forward over `TIP` seconds, holds there for `hold` seconds and
 * comes back over `TIP` seconds; the feet keep their planted goals, so the
 * ankles bend and the centre of mass passes ahead of the toes. A balanced
 * person leans from the hips and moves them back (`gestureBow.bowed`); a broken
 * base is the lean that does not, which is what the partner's pull and the
 * thrower's entry produce.
 *
 * What follows, the body carried over the thrower's hip and its fall, is
 * set by the forces of the throw and is the force-determined follow-up
 * (#3439), not staged here; nor are the receiver's grips and the
 * breakfall.
 *
 * Events: `broken` when the lean is full, `relax` when it starts back.
 *
 * @evidence contracts/development/common.md#meaningful-documentation depth: How far forward the body tips about the ankles, degrees in (0, 30]; `DEPTH` when absent. hold: Seconds the tip is held; 1 when absent.
 * @evidence contracts/development/design.md#principled-representation depth: How far forward the body tips about the ankles, degrees in (0, 30]; `DEPTH` when absent. hold: Seconds the tip is held; 1 when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: grappling/kuzushi.ts (kuzushi.plan, context); grappling/kuzushi.ts (kuzushi.plan).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in kuzushi.plan.
 */
export namespace IAutoMovieMotionHumanKuzushi {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, unit and default.
   * @evidence contracts/development/design.md#principled-representation The tip's size and how long it is held.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The partner is named for the composition's mutual join; the tip itself reads only the body.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
  export interface IParams {
    /** The partner who breaks the base, for the mutual join; unread by the tip. */
    partner?: string;

    /** How far forward the body tips about the ankles, degrees in (0, 30]; 15 degrees when absent ({@link kuzushi.DEPTH}, provisional: past the toes for an adult). The tip takes 0.5 s each way ({@link kuzushi.TIP}, provisional). */
    depth?: number;

    /** Seconds the tip is held at its depth; 1 when absent. The action lasts the tip's 0.5 s each way and this. */
    hold?: number;
  }
}
