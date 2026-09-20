import { IAutoMovieInteractionEvent } from "@automovie/interface";

/**
 * A shot-local interaction event placed on the sequence output clock.
 *
 * @evidence requirements/editorial/rational-time-and-ranges.md#editorial-canonical-time IAutoMoviePlaybackEvent anchors canonical film-clock computation: A shot-local interaction event placed on the sequence output clock.
 * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-rational-timeline IAutoMoviePlaybackEvent realizes rational global-timeline evaluation: A shot-local interaction event placed on the sequence output clock.
 * @author Samchon
 */
export interface IAutoMoviePlaybackEvent extends IAutoMovieInteractionEvent {
  /**
   * Index into `sequence.shots`.
   *
   * @evidence requirements/editorial/tracks-stacks-and-composition.md#editorial-sequential-tracks Retains the owning sequence-entry index when a shot-local event is projected onto the output track.
   * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-track-composition IAutoMoviePlaybackEvent.entry retains the sequence occurrence that projected the event onto output time.
   */
  entry: number;

  /**
   * Shot id that owns the source event.
   *
   * @evidence requirements/editorial/tracks-stacks-and-composition.md#editorial-sequential-tracks IAutoMoviePlaybackEvent.shot supports ordered output-track composition: Shot id that owns the source event.
   * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-track-composition IAutoMoviePlaybackEvent.shot realizes ordered output-track composition: Shot id that owns the source event.
   */
  shot: string;

  /**
   * Original shot-local event time.
   *
   * @evidence requirements/editorial/rational-time-and-ranges.md#editorial-canonical-time IAutoMoviePlaybackEvent.shotTime anchors canonical film-clock computation: Original shot-local event time.
   * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-rational-timeline IAutoMoviePlaybackEvent.shotTime realizes rational global-timeline evaluation: Original shot-local event time.
   */
  shotTime: number;

  /**
   * Global output second after trims and transitions.
   *
   * @evidence requirements/editorial/rational-time-and-ranges.md#editorial-canonical-time IAutoMoviePlaybackEvent.globalTime anchors canonical film-clock computation: Global output second after trims and transitions.
   * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-rational-timeline IAutoMoviePlaybackEvent.globalTime realizes rational global-timeline evaluation: Global output second after trims and transitions.
   */
  globalTime: number;
}
