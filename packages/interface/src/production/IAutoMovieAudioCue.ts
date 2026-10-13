import { AutoMovieFilmTime } from "./AutoMovieFilmTime";

/**
 * Frame-grid placement and trim of one declared audio asset in the film. Source and film intervals must fit their respective durations; fades together cannot exceed the cue span. Gain is a finite linear multiplier in `[0, 4]`.
 *
 * @evidence contracts/common.md#principled-implementation Exact frame-or-second boundaries describe the source trim and film placement; film assembly converts them to the common frame grid and checks source bounds, film bounds, fade coverage and finite bounded gain before rendering.
 * @evidence contracts/common.md#clear-and-simple-design One cue owns source range, destination start, gain, fades and bus, while asset bytes and production frame rate stay in their own ledger and frame-format records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Declared source duration does not exempt trim arithmetic, and out-of-bounds or off-grid audio is refused rather than silently shortened to the available asset or film.
 * @evidence contracts/common.md#meaningful-documentation Gives source-versus-film time ownership, frame-grid interpretation, interval and fade constraints, finite linear gain bounds and the four deterministic destination buses.
 * @author Samchon
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
