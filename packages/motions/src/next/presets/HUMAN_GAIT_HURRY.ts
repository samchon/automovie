import type { IAutoMovieMotionHumanGait } from "@automovie/interface";

/*
 * The hurry preset: the `fast` walk (about 1.72 m/s at the reference hip) on
 * steps 1.1 times the pace's, about 125 steps a minute, the arms swung 1.3;
 * late for something, a purposeful errand that is not a run. Spread into
 * `walk`'s parameters with the destination; the `hurry` row of `HumanGait`
 * fixes these values. The scales are provisional until a study of hurried
 * walking is read.
 */
export const HUMAN_GAIT_HURRY: IAutoMovieMotionHumanGait.IStridePreset = {
  pace: "fast",
  stride: 1.1,
  armSwing: 1.3,
};
