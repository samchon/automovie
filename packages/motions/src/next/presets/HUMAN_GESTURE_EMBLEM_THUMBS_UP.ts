import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/*
 * The values the `thumbsUp` row of `HumanEmblem` fixes on `gesture`, spread
 * into its parameters. A thumbs up: the fist held out before the shoulder,
 * turned a quarter in its palm's plane and then aimed so the straight thumb
 * itself stands up (it lies about 35 degrees off the knuckle line, so the
 * quarter turn alone left it 42 degrees off).
 */
export const HUMAN_GESTURE_EMBLEM_THUMBS_UP: IAutoMovieMotionHumanGesture.IGestureKindShapeTurnAimPreset =
  {
    kind: "stopPalm",
    shape: "thumbUp",
    turn: 90,
    aim: { digit: "thumb", toward: "up" },
  };
