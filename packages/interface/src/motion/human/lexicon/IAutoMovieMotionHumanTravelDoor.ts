import type { IAutoMovieMotionHumanWalkParams } from "../actions/IAutoMovieMotionHumanWalkParams";

/**
 * Going through a doorway: travel that lines up with a named opening
 * of one of the performance's obstacles, passes through its middle and
 * comes out beyond it. Register `HumanTravelDoor.passThrough` to use it.
 *
 * The upright gait squares up on the opening's line and uses the ordinary
 * walk's clearance. Ducking, squeezing and a prone crawl fit the posed
 * body through the full depth of a fixed opening whose sill is at floor
 * height, and refuse with the width or headroom the posed body needs.
 * Enter the crawl prone and compose it with a floor transition and get-up.
 *
 * @evidence contracts/development/common.md#meaningful-documentation aperture: The opening's id within that obstacle; its only opening when absent. mode: The posture fitted through the opening; upright when absent. pace: The pace of the standing gait.
 * @evidence contracts/development/design.md#principled-representation aperture: The opening's id within that obstacle; its only opening when absent. mode: The posture fitted through the opening; upright when absent. pace: The pace of the standing gait.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanTravelDoor.ts (HumanTravelDoor.passThrough, context); lexicon/planReducedOpening.ts (planReducedOpening, context).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanWalkParams identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanTravelDoor {
  /**
   * How the body passes the opening: `upright` walks through, `duck`
   * lowers the pelvis and pitches the trunk under the lintel, `squeeze`
   * turns side-on between the jambs, and `crawl` travels prone on
   * alternating palms from a prone entry.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each posture does and the crawl's entry requirement.
   * @evidence contracts/development/design.md#principled-representation A closed choice of posture; the opening's dimensions decide whether it fits.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by HumanTravelDoor.passThrough and planReducedOpening.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; the fit is measured at runtime.
   */
  export type Mode = "upright" | "duck" | "squeeze" | "crawl";

  /**
   * Parameters of a passage.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   *
   * @evidence contracts/development/common.md#meaningful-documentation aperture: The opening's id within that obstacle; its only opening when absent. mode: The posture fitted through the opening; upright when absent. pace: The pace of the standing gait.
   * @evidence contracts/development/design.md#principled-representation aperture: The opening's id within that obstacle; its only opening when absent. mode: The posture fitted through the opening; upright when absent. pace: The pace of the standing gait.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanTravelDoor.ts (HumanTravelDoor.passThrough, context); lexicon/planReducedOpening.ts (planReducedOpening, context).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanWalkParams identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IParams {
    /** The obstacle whose opening is passed: its subject id. */
    through: string;

    /** The opening's id within that obstacle; its only opening when absent. */
    aperture?: string;

    /** The posture fitted through the opening; `upright` when absent. */
    mode?: Mode;

    /** The standing gait's pace; `normal` upright and `slow` for duck and squeeze when absent. The crawl ignores it. */
    pace?: IAutoMovieMotionHumanWalkParams["pace"];
  }
}
