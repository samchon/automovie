import type { AutoMovieMotionHumanChannel } from "../compose/AutoMovieMotionHumanChannel";

/**
 * A channel whose writer follows another performer live over a window of
 * its plan (an arm that tracks a partner's region a feedback delay
 * earlier): inside the window, reading the channel reads that partner.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the channel, the window and what reading it inside the window reads.
 * @evidence contracts/development/design.md#principled-representation One channel and the plan seconds its follower writes, the composer's primitive window.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, set by the composer and read by the display's plan-level course.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the canonical channel; the window is the primitive's own.
 */
export interface IAutoMovieMotionHumanFollow {
  /** The channel. */
  channel: AutoMovieMotionHumanChannel;

  /** Seconds since the plan's start from which its writer follows. */
  from: number;

  /** Seconds since the plan's start until which its writer follows. */
  to: number;
}
