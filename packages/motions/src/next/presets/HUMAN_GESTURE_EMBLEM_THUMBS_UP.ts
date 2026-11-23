import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `thumbsUp` row of `HumanEmblem` fixes on `gesture`, spread
 * into its parameters. A thumbs up: the fist held out before the shoulder,
 * turned a quarter in its palm's plane and then aimed so the straight thumb
 * itself stands up (it lies about 35 degrees off the knuckle line, so the
 * quarter turn alone left it 42 degrees off).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IGestureKindShapeTurnAimPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGesture.EMBLEM_THUMBS_UP`; the `thumbsUp` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_GESTURE_EMBLEM_THUMBS_UP: IAutoMovieMotionHumanGesture.IGestureKindShapeTurnAimPreset =
  {
    kind: "stopPalm",
    shape: "thumbUp",
    turn: 90,
    aim: { digit: "thumb", toward: "up" },
  };
