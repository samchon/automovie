import type { IAutoMovieMotionHumanGesture } from "@automovie/interface";

/*
 * The values the `palmsTogether` row of `HumanEmblem` fixes on `gesture`,
 * spread into its parameters. Palms together ahead of the chest, as a prayer or
 * a greeting (wai, gassho): the gesture's held meeting of the two palms.
 */
export const HUMAN_GESTURE_EMBLEM_PALMS_TOGETHER: IAutoMovieMotionHumanGesture.IGestureKindPreset =
  {
    kind: "palmsTogether",
  };
