import { IAutoMoviePlaybackEntry } from "./IAutoMoviePlaybackEntry";

/** The resolved output timeline: entry placements and the total runtime. */
export interface IAutoMoviePlaybackTimeline {
  /** Sequence entries placed on the global output clock. */
  entries: IAutoMoviePlaybackEntry[];

  /** Total output seconds (transition overlaps subtracted). */
  runtime: number;
}
