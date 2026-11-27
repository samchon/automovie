import type { IAutoMovieMotionHumanLabour } from "@automovie/interface";

/*
 * The haul preset: both hands carry a load of 0.25 of the body mass, the most a
 * carry accepts, at the `slow` walk (about 0.82 m/s); labour, strain. Spread
 * into `carry`'s parameters with the destination; the `haul` row of
 * `HumanLabour` fixes these values.
 */
export const HUMAN_LABOUR_HAUL: IAutoMovieMotionHumanLabour.IHaulPreset = {
  kind: "twoHands",
  pace: "slow",
  load: 0.25,
};
