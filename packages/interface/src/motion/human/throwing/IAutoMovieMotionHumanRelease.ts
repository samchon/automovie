import type { IAutoMovieMotionHumanHand } from "../posture/IAutoMovieMotionHumanHand";

/**
 * Letting go: a hand opens on what it holds, and the held prop leaves it.
 *
 * The hand stays where the hold kept it on the trunk (its grip frame at the
 * entry, read in the chest's frame and carried with the chest the carrier
 * shows), and opens at `open`, the decisive instant, a brief pause
 * (`AutoMovieMotionHumanTiming.PAUSES.brief`, provisional) after the entry.
 * Until then its grip window on the prop takes the hand over from the hold;
 * at `open` the prop is launched (`IAutoMovieMotionHumanActionPlan.launches`) with the
 * hand's velocity there, the central difference of the carried grip point at
 * the engine's plan-time step (`integrateMotionTrajectory.STEP`), so a drop
 * from a still hand falls and one from a moving carrier carries its speed.
 *
 * A prop that rests on something the hand held back (an arrow on a drawn
 * string, #3487) is launched by `launch` instead: along its line from one of
 * its points to another, at the speed the launcher gives (a bow's
 * `launchSpeed` at the string's travel), plus the hand's velocity.
 *
 * It is performed over a carrier and claims only that hand's arm. A hand
 * that holds nothing is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation hand: The opening hand; `right` when absent. prop: The prop it lets go of; the one the hand holds at the entry when absent. speed: The launcher's speed along the line, metres per second.
 * @evidence contracts/development/design.md#principled-representation hand: The opening hand; `right` when absent. prop: The prop it lets go of; the one the hand holds at the entry when absent. speed: The launcher's speed along the line, metres per second.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: chain/HumanChainMutual.ts (HumanChainMutual.release, params); throwing/release.ts (release.plan, context).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanHand.Side identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanRelease {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The hand, the held prop and a launcher's own launch.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members read by `plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The launch speed is the launcher's, given by the row that knows it.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
  export interface IParams {
    /** The opening hand; `right` when absent. */
    hand?: IAutoMovieMotionHumanHand.Side;

    /** The prop it lets go of; the one the hand holds at the entry when absent. */
    prop?: string;

    /**
     * A prop launched along its own line at a launcher's speed instead of
     * the held prop's drop: an arrow on the drawn string.
     */
    launch?: {
      /** The launched prop's subject. */
      prop: string;
      /** The prop's point its line starts from, such as an arrow's `nock`. */
      from: string;
      /** The point its line runs to, such as the arrow's `tip`. */
      to: string;
      /** The launcher's speed along the line, metres per second. */
      speed: number;
    };
  }
}
