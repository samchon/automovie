import type { IAutoMovieClassifyPlaybackBoundary, IAutoMoviePlaybackTimeline, IAutoMovieSequence } from "@automovie/interface";
import type { ISelectAutoMoviePlacedChecksTrack } from "./ISelectAutoMoviePlacedChecksTrack.js";

/** Continuous tracks evaluated across the film's cut. */
export interface ISelectAutoMoviePlacedChecksContinuity {
  /** The film's cut, already admitted by `cutSequence`. */
  readonly sequence: IAutoMovieSequence;
  /** Layout of `sequence` from `sequenceTimeline`. */
  readonly timeline: IAutoMoviePlaybackTimeline;
  /** Deliberate breaks in authored takes. */
  readonly discontinuities?: IAutoMovieClassifyPlaybackBoundary.IProps["discontinuities"];
  /** Tracks to check. */
  readonly tracks: readonly ISelectAutoMoviePlacedChecksTrack[];
}
