import type { IAutoMovieMotionHumanGait } from "@automovie/interface";

/**
 * The follow preset: come up behind the person (`from: "behind"`) to the social
 * distance (`at: "social"`, `HumanProxemics.GAPS`), matching their speed on the
 * way (`track: "pace"`), as a follower closes the gap. Spread into `approach`'s
 * parameters with the person; the `follow` row of `HumanPursuit` fixes these
 * values.
 */
export const HUMAN_GAIT_FOLLOW: IAutoMovieMotionHumanGait.ITrackingApproachPreset =
  {
    from: "behind",
    at: "social",
    track: "pace",
  };
