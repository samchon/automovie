import type { IAutoMovieMotionHumanTouch } from "@automovie/interface";

/**
 * The values the `touchHold` row of `HumanTouchRows` fixes on `touch`, spread
 * into its parameters. `touch` of kind `hold`: one placement of 0.4 s, then
 * held 1.2 s, 1.6 s after the reach; a hand laid on a shoulder or an arm
 * ({@link AutoMovieMotionHumanTouchForm.FORMS}; `count` and `hold` override;
 * provisional except the stroke).
 */
export const HUMAN_TOUCH_HOLD: IAutoMovieMotionHumanTouch.ITouchKindPreset = {
  kind: "hold",
};
