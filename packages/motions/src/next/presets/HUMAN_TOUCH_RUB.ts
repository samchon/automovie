import type { IAutoMovieMotionHumanTouch } from "@automovie/interface";

/*
 * The values the `touchRub` row of `HumanTouchRows` fixes on `touch`, spread
 * into its parameters. `touch` of kind `rub`: 3 rubs of 0.5 s, then 0.4 s, 1.9
 * s after the reach; warming, soothing, rubbing a shoulder or a back
 * (AutoMovieMotionHumanTouchForm.FORMS; `count` and `hold` override;
 * provisional except the stroke).
 */
export const HUMAN_TOUCH_RUB: IAutoMovieMotionHumanTouch.ITouchKindPreset = {
  kind: "rub",
};
