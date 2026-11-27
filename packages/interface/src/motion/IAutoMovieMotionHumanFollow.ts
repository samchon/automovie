import type { AutoMovieMotionHumanChannel } from "./AutoMovieMotionHumanChannel";

/**
 * A channel whose writer follows another performer live over a window of its
 * plan (an arm that tracks a partner's region a feedback delay earlier): inside
 * the window, reading the channel reads that partner.
 */
export interface IAutoMovieMotionHumanFollow {
  /** The channel. */
  channel: AutoMovieMotionHumanChannel;

  /** Seconds since the plan's start from which its writer follows. */
  from: number;

  /** Seconds since the plan's start until which its writer follows. */
  to: number;
}
