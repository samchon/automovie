import type { IAutoMovieTransition } from "./IAutoMovieTransition";
import type { IAutoMovieTrim } from "./IAutoMovieTrim";

/**
 * One shot's placement in a sequence with a source trim, a playback rate and
 * an optional incoming transition.
 *
 * The retained source duration divided by the playback rate gives the output
 * span. The output start is the previous entry's end minus the incoming
 * transition's duration.
 * `cutSequence` requires a nonblank built-shot id, a positive source span
 * inside the shot, a positive finite rate and a representable output span.
 * Each overlap must fit both adjacent output spans and leave room for any
 * other overlap in those spans.
 *
 * @evidence contracts/development/design.md#principled-representation `sequenceTimeline` takes its source offset from `trim.start` and divides the retained source duration by the rate. The incoming transition duration shifts the placement start on the output clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The playback rate retimes the source without copying the shot. The optional source end retains a symbolic trim's exact event boundary for source comparisons.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A transition on the first entry is refused by `cutSequence` and thrown by `sequenceTimeline` rather than silently dropped, and an unknown shot id is refused rather than skipped.
 * @evidence contracts/development/common.md#meaningful-documentation States how the source trim, playback rate and transition determine the played span and output start, and lists admission and default rules.
 */
export interface IAutoMovieSequenceEntry {
  /** Id of the {@link IAutoMovieShot} played here; it must name a built shot. */
  shot: string;

  /**
   * Trim into the shot in seconds, the OpenTimelineIO `source_range`
   * analogue, or `null` to play the whole shot.
   */
  trim: IAutoMovieTrim | null;

  /**
   * Exact source end in shot-local seconds, set by `cutSequence` for a
   * symbolic trim. Both selected event anchors are used exactly for source
   * comparisons. The stored duration owns the output clock.
   */
  exactSourceEnd?: number;

  /** Finite positive source seconds per output second. Omit for 1× playback. */
  playbackRate?: number;

  /**
   * Blend into this entry from the previous one, or `null` for a hard cut (the
   * default). The first entry has no previous one, so it must be `null`.
   */
  transition: IAutoMovieTransition | null;
}
