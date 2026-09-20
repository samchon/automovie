/**
 * One entry's placement on the output timeline: where it starts globally, how
 * long it plays (its trim, else the whole shot), and the shot-local second its
 * playback begins at.
 *
 * @evidence requirements/editorial/tracks-stacks-and-composition.md#editorial-sequential-tracks IAutoMoviePlaybackEntry supports ordered output-track composition: One entry's placement on the output timeline: where it starts globally, how long it plays (its trim, else the whole shot), and the shot-local second its playback begins at.
 * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-track-composition IAutoMoviePlaybackEntry realizes ordered output-track composition: One entry's placement on the output timeline: where it starts globally, how long it plays (its trim, else the whole shot), and the shot-local second its playback begins at.
 * @author Samchon
 */
export interface IAutoMoviePlaybackEntry {
  /**
   * Index into `sequence.shots`.
   *
   * @evidence requirements/editorial/tracks-stacks-and-composition.md#editorial-sequential-tracks Identifies which ordered sequence entry owns this playback placement on the composed output track.
   * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-track-composition IAutoMoviePlaybackEntry.entry binds a timeline placement to its ordered sequence entry.
   */
  entry: number;

  /**
   * Shot id played here.
   *
   * @evidence requirements/editorial/tracks-stacks-and-composition.md#editorial-sequential-tracks IAutoMoviePlaybackEntry.shot supports ordered output-track composition: Shot id played here.
   * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-track-composition IAutoMoviePlaybackEntry.shot realizes ordered output-track composition: Shot id played here.
   */
  shot: string;

  /**
   * Global output second this entry starts at.
   *
   * @evidence requirements/editorial/rational-time-and-ranges.md#editorial-canonical-time IAutoMoviePlaybackEntry.start anchors canonical film-clock computation: Global output second this entry starts at.
   * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-rational-timeline IAutoMoviePlaybackEntry.start realizes rational global-timeline evaluation: Global output second this entry starts at.
   */
  start: number;

  /**
   * Seconds of the shot this entry plays.
   *
   * @evidence requirements/editorial/rational-time-and-ranges.md#editorial-canonical-time IAutoMoviePlaybackEntry.played anchors canonical film-clock computation: Seconds of the shot this entry plays.
   * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-rational-timeline IAutoMoviePlaybackEntry.played realizes rational global-timeline evaluation: Seconds of the shot this entry plays.
   */
  played: number;

  /**
   * Shot-local second playback begins at (the trim's start, else 0).
   *
   * @evidence requirements/editorial/rational-time-and-ranges.md#editorial-canonical-time IAutoMoviePlaybackEntry.offset anchors canonical film-clock computation: Shot-local second playback begins at (the trim's start, else 0).
   * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-rational-timeline IAutoMoviePlaybackEntry.offset realizes rational global-timeline evaluation: Shot-local second playback begins at (the trim's start, else 0).
   */
  offset: number;
}
