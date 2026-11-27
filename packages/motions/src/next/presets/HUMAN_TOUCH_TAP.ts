import type { IAutoMovieMotionHumanTouch } from "@automovie/interface";

/*
 * The values the `touchTap` row of `HumanTouchRows` fixes on `touch`, spread
 * into its parameters. `touch` of kind `tap`: 3 taps of 0.3 s, then 0.4 s on
 * the place, in all 1.3 s after the reach; a light attention-getting touch on a
 * shoulder or an arm (AutoMovieMotionHumanTouchForm.FORMS; `count` and
 * `hold` override; provisional except the stroke).
 */
export const HUMAN_TOUCH_TAP: IAutoMovieMotionHumanTouch.ITouchKindPreset = {
  kind: "tap",
};
