import type { IAutoMovieMotionHumanGait } from "@automovie/interface";

/*
 * The swagger preset: the `normal` walk (about 1.5 m/s at the reference hip),
 * the arms swung 1.5 and the elbows held 20 degrees out; confidence, a
 * challenge, showing off. Spread into `walk`'s parameters with the destination;
 * the `swagger` row of `HumanGait` fixes these values. The scales are
 * provisional until a study of the swagger is read.
 */
export const HUMAN_GAIT_SWAGGER: IAutoMovieMotionHumanGait.ICarriagePreset = {
  pace: "normal",
  armSwing: 1.5,
  elbows: 20,
};
