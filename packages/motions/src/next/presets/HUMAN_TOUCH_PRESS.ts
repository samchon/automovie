import type { IAutoMovieMotionHumanTouch } from "@automovie/interface";

/**
 * The values the `touchPress` row of `HumanTouchRows` fixes on `touch`, spread
 * into its parameters. `touch` of kind `press`: one press of 0.4 s, then held
 * 1.2 s, 1.6 s after the reach; a firm touch, pushing a button on a person,
 * steadying ({@link AutoMovieMotionHumanTouchForm.FORMS}; `count` and `hold`
 * override; provisional except the stroke).
 */
export const HUMAN_TOUCH_PRESS: IAutoMovieMotionHumanTouch.ITouchKindPreset = {
  kind: "press",
};
