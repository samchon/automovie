import type { IAutoMovieMotionHumanStance } from "@automovie/interface";

/*
 * The restElbowSupport preset of `rest`: Both hands at the elbow support.
 * Spread into `rest`'s parameters; the `restElbowSupport` row reads it.
 */
export const HUMAN_STANCE_ELBOW_SUPPORT: IAutoMovieMotionHumanStance.IRestPreset =
  {
    left: "elbowSupport",
    right: "elbowSupport",
  };
