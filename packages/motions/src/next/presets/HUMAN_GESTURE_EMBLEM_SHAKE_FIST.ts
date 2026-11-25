import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/**
 * The values the `shakeFist` row of `HumanEmblem` fixes on `gesture`, spread
 * into its parameters. A shaken fist: the raised fist swung from side to side
 * (first pass on the wave's stroke, provisional).
 */
export const HUMAN_GESTURE_EMBLEM_SHAKE_FIST: IAutoMovieMotionHumanGesture.IGestureKindShapePreset =
  {
    kind: "wave",
    shape: "thumbUp",
  };
