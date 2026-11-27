import type { IAutoMovieMotionHumanStrike } from "@automovie/interface";

/*
 * The armada preset: capoeira's armada, a whole turn and then the rear leg's
 * straight sweep outward. Spread into `footStrike`'s parameters beside the rest
 * that the composition gives; each value means what the law's member of the
 * same name does. The `armada` row of `HumanStrike` fixes these values.
 */
export const HUMAN_STRIKE_ARMADA: IAutoMovieMotionHumanStrike.IFootStrikePreset =
  {
    technique: "hook",
    leg: "rear",
    spin: true,
  };
