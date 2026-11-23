import type { IAutoMovieMotionHumanGait } from "@automovie/interface";

/**
 * The follow preset: come up behind the person (`from: "behind"`) to the social
 * distance (`at: "social"`, `HumanProxemics.GAPS`), matching their speed on the
 * way (`track: "pace"`), as a follower closes the gap. Spread into `approach`'s
 * parameters with the person; the `follow` row of `HumanPursuit` fixes these
 * values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the side, distance and tracking the preset fixes with their results, how it is applied and which row reads it.
 * @evidence contracts/development/design.md#principled-representation The approach's own side, band and tracking as one `ITrackingApproachPreset`, so it fits any body as the approach does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGait.FOLLOW`; the follow row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_GAIT_FOLLOW: IAutoMovieMotionHumanGait.ITrackingApproachPreset =
  {
    from: "behind",
    at: "social",
    track: "pace",
  };
