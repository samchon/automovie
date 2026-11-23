import type { IAutoMovieFilmTime } from "./IAutoMovieFilmTime";

/**
 * Frame-grid placement and trim of one declared audio asset in the film. Source
 * and film intervals must fit their respective durations; fades together cannot
 * exceed the cue span. Gain is a finite linear multiplier in `[0, 4]`.
 */
export interface IAutoMovieAudioCue {
  /** Stable cue id. */
  id: string;

  /** Project-relative declared render-content asset. */
  asset: string;

  /** Declared source duration used for bounded trim validation. */
  sourceDuration: IAutoMovieFilmTime;

  /** Source offset inside the asset. */
  sourceOffset: IAutoMovieFilmTime;

  /** Film-global cue start. */
  start: IAutoMovieFilmTime;

  /** Cue duration. */
  duration: IAutoMovieFilmTime;

  /** Finite linear gain in `[0, 4]`: zero is silence, one preserves amplitude. */
  gain: number;

  /** Fade-in duration. */
  fadeIn: IAutoMovieFilmTime;

  /** Fade-out duration. */
  fadeOut: IAutoMovieFilmTime;

  /** Deterministic destination bus. */
  bus: "dialogue" | "music" | "effects" | "ambience";
}
