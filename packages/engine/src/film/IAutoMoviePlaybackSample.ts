/**
 * What plays at one output instant: the live entry's shot at its local time,
 * plus, inside an incoming transition, the outgoing entry's tail and the
 * incoming shot's weight ramping 0 → 1 across the transition.
 *
 * @evidence requirements/editorial/rational-time-and-ranges.md#editorial-canonical-time IAutoMoviePlaybackSample anchors canonical film-clock computation: What plays at one output instant: the live entry's shot at its local time, plus, inside an incoming transition, the outgoing entry's tail and the incoming shot's weight ramping 0 → 1 across the transition.
 * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-rational-timeline IAutoMoviePlaybackSample realizes rational global-timeline evaluation: What plays at one output instant: the live entry's shot at its local time, plus, inside an incoming transition, the outgoing entry's tail and the incoming shot's weight ramping 0 → 1 across the transition.
 */
export interface IAutoMoviePlaybackSample {
  /**
   * Live (incoming) shot id.
   *
   * @evidence requirements/editorial/tracks-stacks-and-composition.md#editorial-sequential-tracks IAutoMoviePlaybackSample.shot supports ordered output-track composition: Live (incoming) shot id.
   * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-track-composition IAutoMoviePlaybackSample.shot realizes ordered output-track composition: Live (incoming) shot id.
   */
  shot: string;

  /**
   * Shot-local seconds into the live shot.
   *
   * @evidence requirements/editorial/rational-time-and-ranges.md#editorial-canonical-time IAutoMoviePlaybackSample.time anchors canonical film-clock computation: Shot-local seconds into the live shot.
   * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-rational-timeline IAutoMoviePlaybackSample.time realizes rational global-timeline evaluation: Shot-local seconds into the live shot.
   */
  time: number;

  /**
   * The outgoing tail being dissolved from, or null on a hard cut.
   *
   * @evidence requirements/editorial/transitions-and-overlaps.md#editorial-overlap-composition IAutoMoviePlaybackSample.blend preserves declared transition overlap: The outgoing tail being dissolved from, or null on a hard cut.
   * @evidence specifications/editorial-render-and-delivery/rational-timeline-and-composition.md#spec-editorial-transition-overlap IAutoMoviePlaybackSample.blend realizes transition-overlap composition: The outgoing tail being dissolved from, or null on a hard cut.
   */
  blend: { shot: string; time: number; alpha: number } | null;
}
