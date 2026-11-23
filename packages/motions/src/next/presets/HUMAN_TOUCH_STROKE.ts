import type { IAutoMovieMotionHumanTouch } from "@automovie/interface";

/**
 * The values the `touchStroke` row of `HumanTouchRows` fixes on `touch`, spread
 * into its parameters. `touch` of kind `stroke`: one stroke at a 5 cm/s peak
 * (the pleasant-touch rate, Loken et al. 2009), about 5 s for a 0.2 m hand,
 * then 0.4 s; a caress, soothing ({@link AutoMovieMotionHumanTouchForm.FORMS};
 * `count` and `hold` override; provisional except the stroke).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `ITouchKindPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanTouch.STROKE`; the `touchStroke` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_TOUCH_STROKE: IAutoMovieMotionHumanTouch.ITouchKindPreset = {
  kind: "stroke",
};
