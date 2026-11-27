import type { IAutoMovieMotionHumanGait } from "@automovie/interface";

/*
 * The trudge preset: the `slow` walk (about 0.82 m/s at the reference hip) on
 * steps 0.8 times the pace's, about 106 steps a minute, the arms swung 0.4;
 * exhaustion, defeat, a long march home. Spread into `walk`'s parameters with
 * the destination; the `trudge` row of `HumanGait` fixes these values. The
 * scales are provisional until a study of weary walking is read.
 */
export const HUMAN_GAIT_TRUDGE: IAutoMovieMotionHumanGait.IStridePreset = {
  pace: "slow",
  stride: 0.8,
  armSwing: 0.4,
};
