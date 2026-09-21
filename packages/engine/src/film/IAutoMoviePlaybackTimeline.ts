import { IAutoMoviePlaybackEntry } from "./IAutoMoviePlaybackEntry";

/**
 * The resolved output timeline: entry placements and the total runtime.
 *
 * @evidence requirements/editorial/rational-time-and-ranges.md#editorial-canonical-time IAutoMoviePlaybackTimeline anchors canonical film-clock computation: The resolved output timeline: entry placements and the total runtime.
 * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-rational-timeline IAutoMoviePlaybackTimeline realizes rational global-timeline evaluation: The resolved output timeline: entry placements and the total runtime.
 */
export interface IAutoMoviePlaybackTimeline {
  /**
   * Sequence entries placed on the global output clock.
   *
   * @evidence requirements/editorial/rational-time-and-ranges.md#editorial-canonical-time IAutoMoviePlaybackTimeline.entries anchors canonical film-clock computation: Sequence entries placed on the global output clock.
   * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-rational-timeline IAutoMoviePlaybackTimeline.entries realizes rational global-timeline evaluation: Sequence entries placed on the global output clock.
   */
  entries: IAutoMoviePlaybackEntry[];

  /**
   * Total output seconds (transition overlaps subtracted).
   *
   * @evidence requirements/editorial/rational-time-and-ranges.md#editorial-canonical-time IAutoMoviePlaybackTimeline.runtime anchors canonical film-clock computation: Total output seconds (transition overlaps subtracted).
   * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-rational-timeline IAutoMoviePlaybackTimeline.runtime realizes rational global-timeline evaluation: Total output seconds (transition overlaps subtracted).
   */
  runtime: number;
}
