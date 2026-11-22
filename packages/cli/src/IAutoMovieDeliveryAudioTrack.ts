/**
 * The presented span of one MP4 audio track in its own media clock, or why the
 * container does not establish it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the clock, the span and the refusal branch.
 * @evidence contracts/development/design.md#principled-representation Keeps the container's integer ticks and clock rather than seconds, so the decoder's sample count compares exactly.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Carries only the clock and presented duration the audio decode trims with.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Unknown timing is a separate reason-carrying branch, never a zero or estimated duration.
 */
export type IAutoMovieDeliveryAudioTrack =
  | {
      /** The container establishes the presented span. */
      status: "read";
      /** Media ticks per second, which for audio is the sample rate. */
      timescale: number;
      /** Presented media ticks after the edit list and sample table are applied. */
      duration: number;
    }
  | {
      /** The container does not establish the presented span. */
      status: "uncovered";
      /** What was missing, unsupported or unreadable. */
      reason: string;
    };
