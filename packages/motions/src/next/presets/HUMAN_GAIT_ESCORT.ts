import type { IAutoMovieMotionHumanGait } from "@automovie/interface";

/**
 * The escort preset: come to the person's left side (`from: "left"`) at the
 * personal distance (`at: "personal"`, `HumanProxemics.GAPS`), matching their
 * speed on the way (`track: "pace"`), as an escort takes station. Spread into
 * `approach`'s parameters with the person; the `escort` row of
 * `HumanPursuit` fixes these values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the side, distance and tracking the preset fixes with their results, how it is applied and which row reads it.
 * @evidence contracts/development/design.md#principled-representation The approach's own side, band and tracking as one `ITrackingApproachPreset`, so it fits any body as the approach does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGait.ESCORT`; the escort row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_GAIT_ESCORT: IAutoMovieMotionHumanGait.ITrackingApproachPreset =
  {
    from: "left",
    at: "personal",
    track: "pace",
  };
