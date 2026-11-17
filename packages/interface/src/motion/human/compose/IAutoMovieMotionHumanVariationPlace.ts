import type { IAutoMovieMotionHumanTargetGrid } from "./IAutoMovieMotionHumanTargetGrid";

/**
 * The seeded offset of a place of the air: where a hand arrives within what
 * its named place allows.
 *
 * `AutoMovieMotionHumanVariation` states what a slot, a spread and a source
 * are and owns `SPREADS` and `ACROSS`; `AutoMovieMotionHumanVariationDraw`
 * owns `TRUNCATE` and the cell rule. A place is the one slot whose offset has three components and whose
 * bound differs by axis, so it reads how the hand arrives and bounds each
 * axis by that axis's names.
 *
 * @evidence contracts/development/common.md#meaningful-documentation distance: The distance the hand travels in the arriving phase, metres. seconds: The length of the arriving phase, seconds; positive. direction: The direction of arrival in the nudge frame (`out`, `up`, `forward`); forward when absent.
 * @evidence contracts/development/design.md#principled-representation distance: The distance the hand travels in the arriving phase, metres. seconds: The length of the arriving phase, seconds; positive. direction: The direction of arrival in the nudge frame (`out`, `up`, `forward`); forward when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: compose/AutoMovieMotionHumanVariationPlace.ts (AutoMovieMotionHumanVariationPlace.vary, travel); everyday/gesture.ts (gesture.plan).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanTargetGrid.INudge identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanVariationPlace {
  /**
   * How a hand arrives on a place.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the record is; each member states its unit, its frame and its value when absent.
   * @evidence contracts/development/design.md#principled-representation The distance and the time of the arriving phase, the two inputs of the impulse variability law, and the direction the end point's ellipse is longest along.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members read by `vary`; the phrase that arrives already has all three.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The direction is stated in the nudge frame the offset is read in, so no second frame enters.
   */
  export interface ITravel {
    /** The distance the hand travels in the arriving phase, metres. */
    distance: number;

    /** The length of the arriving phase, seconds; positive. */
    seconds: number;

    /** The direction of arrival in the nudge frame (`out`, `up`, `forward`); forward when absent. */
    direction?: IAutoMovieMotionHumanTargetGrid.INudge;
  }
}
