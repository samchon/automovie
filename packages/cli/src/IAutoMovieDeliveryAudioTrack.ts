/**
 * The presented span of one MP4 audio track in its own media clock, or why the
 * container does not establish it.
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
