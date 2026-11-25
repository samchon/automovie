import type { IAutoMovieTransition } from "./IAutoMovieTransition";
import type { IAutoMovieTrim } from "./IAutoMovieTrim";

/**
 * One shot's placement in a sequence with a source trim, a playback rate and an
 * optional incoming transition.
 *
 * The retained source duration divided by the playback rate gives the output
 * span. The output start is the previous entry's end minus the incoming
 * transition's duration. `cutSequence` requires a built-shot id, a positive
 * source span inside the shot, a positive finite rate and a
 * representable output span. Each overlap must fit both adjacent output spans
 * and leave room for any other overlap in those spans.
 */
export interface IAutoMovieSequenceEntry {
  /** Id of the {@link IAutoMovieShot} played here; it must name a built shot. */
  shot: string;

  /**
   * Trim into the shot in seconds, the OpenTimelineIO `source_range` analogue,
   * or `null` to play the whole shot.
   */
  trim: IAutoMovieTrim | null;

  /**
   * Exact source end in shot-local seconds, set by `cutSequence` for a symbolic
   * trim. Both selected event anchors are used exactly for source comparisons.
   * The stored duration owns the output clock.
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
