/**
 * One non-negative film time authored as an exact frame or frame-grid second. Frame values must be safe integers; second values must resolve to the production's frame grid. Supply one representation per value.
 *
 * @evidence contracts/development/design.md#principled-representation An explicit safe-integer frame count or grid-aligned second value expresses one production-clock boundary. This authoring union computes no conversion; the production edit normalizer is retired and a host must explicitly resolve the chosen representation against its rational clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two authoring forms share one time type without carrying an independent frame rate per timestamp; the production's frame format owns that conversion.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Seconds do not authorize approximate cuts between frames, and no clip-specific frame clock overrides the production grid; callers must supply one time representation.
 * @evidence contracts/development/common.md#meaningful-documentation Gives zero-based frames, nonnegative time, safe-integer frame counts and exact grid-aligned seconds, with the production owning the frame rate.
 */
export type AutoMovieFilmTime =
  | {
      /** Zero-based production frame. */
      frame: number;
    }
  | {
      /** Seconds that must land exactly on the production frame clock. */
      seconds: number;
    };
