import type { IAutoMovieMotionHumanGait } from "@automovie/interface";

/**
 * The stroll preset: the `slow` walk (about 0.82 m/s at the reference hip) on
 * steps 0.9 times the pace's, about 94 steps a minute, the arms swung 0.8;
 * leisure, waiting about, a quiet street. Spread into `walk`'s parameters with
 * the destination; the `stroll` row of `HumanGait` fixes these values. The
 * scales are provisional until a study of strolling is read.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the pace, step and swing the preset fixes with their results, how it is applied, which row reads it and what is provisional.
 * @evidence contracts/development/design.md#principled-representation The walk's own pace and scales as one `IStridePreset`, so it fits any body as the walk does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGait.STROLL`; the stroll row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_GAIT_STROLL: IAutoMovieMotionHumanGait.IStridePreset = {
  pace: "slow",
  stride: 0.9,
  armSwing: 0.8,
};
