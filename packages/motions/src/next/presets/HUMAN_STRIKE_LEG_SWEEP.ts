import type { IAutoMovieMotionHumanStrike } from "@automovie/interface";

/*
 * The legSweep preset: a leg sweep with the lead leg. Spread into
 * `footStrike`'s parameters beside the rest that the composition gives; each
 * value means what the law's member of the same name does. The `legSweep` row
 * of `HumanStrike` fixes these values.
 */
export const HUMAN_STRIKE_LEG_SWEEP: IAutoMovieMotionHumanStrike.IFootStrikePreset =
  {
    technique: "sweep",
    leg: "lead",
  };
