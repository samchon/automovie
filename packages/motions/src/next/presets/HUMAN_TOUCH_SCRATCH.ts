import type { IAutoMovieMotionHumanTouch } from "@automovie/interface";

/*
 * The values the `touchScratch` row of `HumanTouchRows` fixes on `touch`,
 * spread into its parameters. `touch` of kind `scratch`: 3 scratches of 0.2 s
 * with curled fingers, then 0.4 s, 1.0 s after the reach; an itch, scratching
 * the head or an arm (AutoMovieMotionHumanTouchForm.FORMS; `count` and
 * `hold` override; provisional except the stroke).
 */
export const HUMAN_TOUCH_SCRATCH: IAutoMovieMotionHumanTouch.ITouchKindPreset =
  {
    kind: "scratch",
  };
