/**
 * One sequence entry of a delivered film with the output frames it is live in:
 * the row `render-report.json` keeps per entry of the film's cut.
 *
 * `entry`, `shot`, `start`, `played`, `offset` and `playbackRate` are copied
 * from the film's `IAutoMoviePlaybackEntry`. `liveFrames` is computed by
 * `planDeliveredCut` against the instants the render drew, so it
 * agrees with the drawn frames rather than with a rounding of `start`.
 *
 * A row is keyed by `entry`, because a sequence can play one shot in two
 * entries. `liveFrames` names the entry whose timeline is sampled at each
 * frame, which `playbackCursor` picks as the highest entry whose `start` is at
 * or before the frame's instant: an entry that opens with a transition is live
 * from the transition's first frame, while the picture there is still mostly
 * the outgoing shot, and only the outgoing shot fading out during the first
 * half of a fade.
 */
export interface IAutoMovieDeliveredCutEntry {
  /** Index of this entry in the sequence's `shots`. */
  entry: number;

  /** Id of the shot this entry plays; not unique within a cut. */
  shot: string;

  /**
   * Output second this entry starts at, overlapping the previous entry's tail
   * by its transition.
   */
  start: number;

  /** Output seconds this entry occupies. */
  played: number;

  /** Shot-local second its playback begins at. */
  offset: number;

  /**
   * Source seconds per output second; absent when the entry plays at the
   * default rate.
   */
  playbackRate?: number;

  /**
   * Output frame indices `[first, endExclusive)` this entry is live in, counted
   * on the delivered file's frame grid from 0.
   *
   * Empty, `[k, k)`, for an entry whose whole span the next entry's transition
   * covers before any frame instant falls in it. The ranges of a cut tile `[0,
   * frameCount)` in entry order with no gap or overlap.
   */
  liveFrames: [number, number];
}
