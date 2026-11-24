import type { IAutoMovieMotionHumanGait } from "@automovie/interface";

/**
 * The escort preset: come to the person's left side (`from: "left"`) at the
 * personal distance (`at: "personal"`, `HumanProxemics.GAPS`), matching their
 * speed on the way (`track: "pace"`), as an escort takes station. Spread into
 * `approach`'s parameters with the person; the `escort` row of `HumanPursuit`
 * fixes these values.
 */
export const HUMAN_GAIT_ESCORT: IAutoMovieMotionHumanGait.ITrackingApproachPreset =
  {
    from: "left",
    at: "personal",
    track: "pace",
  };
