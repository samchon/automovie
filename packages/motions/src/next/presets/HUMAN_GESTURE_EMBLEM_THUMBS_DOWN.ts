import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `thumbsDown` row of `HumanEmblem` fixes on `gesture`, spread
 * into its parameters. A thumbs down: the fist ahead of the shoulder with the
 * forearm turned over and the elbow raised outward, aimed so the straight thumb
 * itself points down.
 */
export const HUMAN_GESTURE_EMBLEM_THUMBS_DOWN: IAutoMovieMotionHumanGesture.IGestureKindShapeAimPreset =
  {
    kind: "thumbsDown",
    shape: "thumbUp",
    aim: { digit: "thumb", toward: "down" },
  };
