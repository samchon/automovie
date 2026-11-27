import type { IAutoMovieMotionHumanStrike } from "@automovie/interface";

/*
 * The stomp preset: a stomp with the rear leg onto a floor-level target. Spread
 * into `footStrike`'s parameters beside the rest that the composition gives;
 * each value means what the law's member of the same name does. The `stomp` row
 * of `HumanStrike` fixes these values.
 */
export const HUMAN_STRIKE_STOMP: IAutoMovieMotionHumanStrike.IFootStrikePreset =
  {
    technique: "stomp",
    leg: "rear",
  };
