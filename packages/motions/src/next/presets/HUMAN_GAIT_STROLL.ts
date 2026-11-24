import type { IAutoMovieMotionHumanGait } from "@automovie/interface";

/**
 * The stroll preset: the `slow` walk (about 0.82 m/s at the reference hip) on
 * steps 0.9 times the pace's, about 94 steps a minute, the arms swung 0.8;
 * leisure, waiting about, a quiet street. Spread into `walk`'s parameters with
 * the destination; the `stroll` row of `HumanGait` fixes these values. The
 * scales are provisional until a study of strolling is read.
 */
export const HUMAN_GAIT_STROLL: IAutoMovieMotionHumanGait.IStridePreset = {
  pace: "slow",
  stride: 0.9,
  armSwing: 0.8,
};
