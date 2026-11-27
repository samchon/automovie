import type { IAutoMovieMotionHumanTouch } from "@automovie/interface";

/*
 * The values the `touchSqueeze` row of `HumanTouchRows` fixes on `touch`,
 * spread into its parameters. `touch` of kind `squeeze`: one squeeze of 0.4 s
 * with the fingers curled 20 degrees, held 1.2 s, 1.6 s after the reach;
 * reassurance, a grip on an arm or a hand
 * (AutoMovieMotionHumanTouchForm.FORMS; `count` and `hold` override;
 * provisional except the stroke).
 */
export const HUMAN_TOUCH_SQUEEZE: IAutoMovieMotionHumanTouch.ITouchKindPreset =
  {
    kind: "squeeze",
  };
