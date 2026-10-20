import { AutoMovieFilmTime } from "./AutoMovieFilmTime";

/**
 * Frame-grid placement and trim of one declared audio asset in the film. Source and film intervals must fit their respective durations; fades together cannot exceed the cue span. Gain is a finite linear multiplier in `[0, 4]`.
 *
 * @evidence contracts/common.md#principled-implementation Frame-or-second boundaries describe source trim and film placement before lowering to a common frame grid; this authored DTO carries the required bounds but performs no conversion or validation itself.
 * @evidence contracts/common.md#clear-and-simple-design One cue owns source range, destination start, gain, fades and bus, while asset bytes and production frame rate stay in their own ledger and frame-format records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Declared source duration does not prove actual asset duration; callers must validate frame-grid agreement, trim bounds, fade coverage and finite bounded gain before passing a lowered cue to deterministic mixing.
 * @evidence contracts/common.md#meaningful-documentation Gives source-versus-film time ownership, frame-grid interpretation, interval and fade constraints, finite linear gain bounds and the four deterministic destination buses.
 */
export interface IAutoMovieAudioCue {
  /** Stable cue id. */
  id: string;

  /** Project-relative declared render-content asset. */
  asset: string;

  /** Declared source duration used for bounded trim validation. */
  sourceDuration: AutoMovieFilmTime;

  /** Source offset inside the asset. */
  sourceOffset: AutoMovieFilmTime;

  /** Film-global cue start. */
  start: AutoMovieFilmTime;

  /** Cue duration. */
  duration: AutoMovieFilmTime;

  /** Finite linear gain in `[0, 4]`: zero is silence, one preserves amplitude. */
  gain: number;

  /** Fade-in duration. */
  fadeIn: AutoMovieFilmTime;

  /** Fade-out duration. */
  fadeOut: AutoMovieFilmTime;

  /** Deterministic destination bus. */
  bus: "dialogue" | "music" | "effects" | "ambience";
}
