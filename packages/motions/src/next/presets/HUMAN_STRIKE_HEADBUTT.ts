import type { IAutoMovieMotionHumanStrike } from "@automovie/interface";

/*
 * The headbutt preset: a headbutt, the forehead driven onto the target. Spread
 * into `closeStrike`'s parameters beside the rest that the composition gives;
 * each value means what the law's member of the same name does. The `headbutt`
 * row of `HumanStrike` fixes these values.
 */
export const HUMAN_STRIKE_HEADBUTT: IAutoMovieMotionHumanStrike.ICloseStrikePreset =
  {
    technique: "headbutt",
  };
