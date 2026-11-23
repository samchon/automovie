import type { IAutoMovieMotionHumanGait } from "@automovie/interface";

/**
 * The swagger preset: the `normal` walk (about 1.5 m/s at the reference hip),
 * the arms swung 1.5 and the elbows held 20 degrees out; confidence, a
 * challenge, showing off. Spread into `walk`'s parameters with the
 * destination; the `swagger` row of `HumanGait` fixes these values. The
 * scales are provisional until a study of the swagger is read.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the pace, swing and elbows the preset fixes with their results, how it is applied, which row reads it and what is provisional.
 * @evidence contracts/development/design.md#principled-representation The walk's own pace, swing scale and elbow angle as one `ICarriagePreset`, so it fits any body as the walk does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGait.SWAGGER`; the swagger row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_GAIT_SWAGGER: IAutoMovieMotionHumanGait.ICarriagePreset = {
  pace: "normal",
  armSwing: 1.5,
  elbows: 20,
};
