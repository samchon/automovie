import type { IAutoMovieMotionHumanNext } from "@automovie/interface";

/**
 * The trudge preset: the `slow` walk (about 0.82 m/s at the reference hip)
 * on steps 0.8 times the pace's, about 106 steps a minute, the arms swung
 * 0.4; exhaustion, defeat, a long march home. Spread into `walk`'s
 * parameters with the destination; the `trudge` row of `HumanGait` fixes
 * these values. The scales are provisional until a study of weary walking is
 * read.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the pace, step and swing the preset fixes with their results, how it is applied, which row reads it and what is provisional.
 * @evidence contracts/development/design.md#principled-representation The walk's own pace and scales as one `IStridePreset`, so it fits any body as the walk does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGait.TRUDGE`; the trudge row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_GAIT_TRUDGE: IAutoMovieMotionHumanNext.IAutoMovieMotionHumanGait.IStridePreset =
  {
    pace: "slow",
    stride: 0.8,
    armSwing: 0.4,
  };
