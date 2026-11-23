import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `thumbsDown` row of `HumanEmblem` fixes on `gesture`, spread
 * into its parameters. A thumbs down: the fist ahead of the shoulder with the
 * forearm turned over and the elbow raised outward, aimed so the straight thumb
 * itself points down.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the values the preset fixes, the law it is spread into and the row that reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own parameters as one `IGestureKindShapeAimPreset`, so it fits any body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGesture.EMBLEM_THUMBS_DOWN`; the `thumbsDown` row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_GESTURE_EMBLEM_THUMBS_DOWN: IAutoMovieMotionHumanGesture.IGestureKindShapeAimPreset =
  {
    kind: "thumbsDown",
    shape: "thumbUp",
    aim: { digit: "thumb", toward: "down" },
  };
