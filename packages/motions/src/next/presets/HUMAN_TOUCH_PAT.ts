import type { IAutoMovieMotionHumanTouch } from "@automovie/interface";

/*
 * The values the `touchPat` row of `HumanTouchRows` fixes on `touch`, spread
 * into its parameters. `touch` of kind `pat`: 3 pats of 0.4 s, then 0.4 s, 1.6
 * s after the reach; comfort, praise, a friendly pat
 * (AutoMovieMotionHumanTouchForm.FORMS; `count` and `hold` override;
 * provisional except the stroke).
 */
export const HUMAN_TOUCH_PAT: IAutoMovieMotionHumanTouch.ITouchKindPreset = {
  kind: "pat",
};
