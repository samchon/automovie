import type { IAutoMovieClassifyPlaybackBoundary, IAutoMoviePlaybackTimeline, IAutoMovieSequence } from "@automovie/interface";
import type { IAutoMovieRenderSelectPlacedChecksTrack } from "./IAutoMovieRenderSelectPlacedChecksTrack";

/** Continuous tracks evaluated across the film's cut. */
export interface IAutoMovieRenderSelectPlacedChecksContinuity {
  /** The film's cut, already admitted by `cutSequence`. */
  readonly sequence: IAutoMovieSequence;
  /** Layout of `sequence` from `sequenceTimeline`. */
  readonly timeline: IAutoMoviePlaybackTimeline;
  /** Deliberate breaks in authored takes. */
  readonly discontinuities?: IAutoMovieClassifyPlaybackBoundary.IProps["discontinuities"];
  /** Tracks to check. */
  readonly tracks: readonly IAutoMovieRenderSelectPlacedChecksTrack[];
}
