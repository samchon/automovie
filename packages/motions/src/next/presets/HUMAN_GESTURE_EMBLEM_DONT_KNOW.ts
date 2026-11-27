import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/*
 * The values the `dontKnow` row of `HumanEmblem` fixes on `gesture`, spread
 * into its parameters. "I do not know": the shrug with the palms turned up.
 */
export const HUMAN_GESTURE_EMBLEM_DONT_KNOW: IAutoMovieMotionHumanGesture.IGestureKindPreset =
  {
    kind: "shrug",
  };
