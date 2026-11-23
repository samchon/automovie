import type { IAutoMovieMotionHumanTouch } from "@automovie/interface";

/**
 * The values the `touchTap` row of `HumanTouchRows` fixes on `touch`, spread
 * into its parameters. `touch` of kind `tap`: 3 taps of 0.3 s, then 0.4 s on
 * the place, in all 1.3 s after the reach; a light attention-getting touch on a
 * shoulder or an arm ({@link AutoMovieMotionHumanTouchForm.FORMS}; `count` and
 * `hold` override; provisional except the stroke).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `ITouchKindPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanTouch.TAP`; the `touchTap` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_TOUCH_TAP: IAutoMovieMotionHumanTouch.ITouchKindPreset = {
  kind: "tap",
};
