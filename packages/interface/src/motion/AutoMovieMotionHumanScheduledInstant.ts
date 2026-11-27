/**
 * A scheduled instant expressed as film seconds or a reference to a named
 * action event with an optional occurrence and seconds offset. Layer and
 * prop-track scheduling resolve the same representation.
 */
export type AutoMovieMotionHumanScheduledInstant =
  | number
  | {
      /** Action or cue id supplying the reference event. */
      of: string;
      /**
       * Reference event name; omitted uses the referenced action's default
       * event.
       */
      event?: string;
      /** Zero-based occurrence index of a repeated event; defaults to 0. */
      index?: number;
      /** Signed seconds added to the reference instant; defaults to zero. */
      offset?: number;
    };
