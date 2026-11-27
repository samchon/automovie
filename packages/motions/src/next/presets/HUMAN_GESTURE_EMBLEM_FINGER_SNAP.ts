import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/*
 * The values the `fingerSnap` row of `HumanEmblem` fixes on `gesture`, spread
 * into its parameters. The hand set for a finger snap: the middle fingertip on
 * the thumb's, held out (first pass: the snap's release is not moved).
 */
export const HUMAN_GESTURE_EMBLEM_FINGER_SNAP: IAutoMovieMotionHumanGesture.IGestureKindShapePreset =
  {
    kind: "stopPalm",
    shape: "snap",
  };
