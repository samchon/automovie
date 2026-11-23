import type { IAutoMovieMotionHumanTouch } from "@automovie/interface";

/**
 * The values the `touchSqueeze` row of `HumanTouchRows` fixes on `touch`,
 * spread into its parameters. `touch` of kind `squeeze`: one squeeze of 0.4 s
 * with the fingers curled 20 degrees, held 1.2 s, 1.6 s after the reach;
 * reassurance, a grip on an arm or a hand
 * ({@link AutoMovieMotionHumanTouchForm.FORMS}; `count` and `hold` override;
 * provisional except the stroke).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `ITouchKindPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanTouch.SQUEEZE`; the `touchSqueeze` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_TOUCH_SQUEEZE: IAutoMovieMotionHumanTouch.ITouchKindPreset =
  {
    kind: "squeeze",
  };
