import type { IAutoMovieMotionHumanTouch } from "@automovie/interface";

/**
 * The values the `touchStroke` row of `HumanTouchRows` fixes on `touch`, spread
 * into its parameters. `touch` of kind `stroke`: one stroke at a 5 cm/s peak
 * (the pleasant-touch rate, Loken et al. 2009), about 5 s for a 0.2 m hand,
 * then 0.4 s; a caress, soothing ({@link AutoMovieMotionHumanTouchForm.FORMS};
 * `count` and `hold` override; provisional except the stroke).
 */
export const HUMAN_TOUCH_STROKE: IAutoMovieMotionHumanTouch.ITouchKindPreset = {
  kind: "stroke",
};
