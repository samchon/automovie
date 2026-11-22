import type { IAutoMovieMotionHumanGait } from "@automovie/interface";

/**
 * The hurry preset: the `fast` walk (about 1.72 m/s at the reference hip) on
 * steps 1.1 times the pace's, about 125 steps a minute, the arms swung 1.3;
 * late for something, a purposeful errand that is not a run. Spread into
 * `walk`'s parameters with the destination; the `hurry` row of `HumanGait`
 * fixes these values. The scales are provisional until a study of hurried
 * walking is read.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the pace, step and swing the preset fixes with their results, how it is applied, which row reads it and what is provisional.
 * @evidence contracts/development/design.md#principled-representation The walk's own pace and scales as one `IStridePreset`, so it fits any body as the walk does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGait.HURRY`; the hurry row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_GAIT_HURRY: IAutoMovieMotionHumanGait.IStridePreset = {
  pace: "fast",
  stride: 1.1,
  armSwing: 1.3,
};
