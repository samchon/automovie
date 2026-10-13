import { AutoMovieFilmTime } from "./AutoMovieFilmTime";

/** One declared audio asset placement. */
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

  /** Linear gain from silence through a bounded boost. */
  gain: number;

  /** Fade-in duration. */
  fadeIn: AutoMovieFilmTime;

  /** Fade-out duration. */
  fadeOut: AutoMovieFilmTime;

  /** Deterministic destination bus. */
  bus: "dialogue" | "music" | "effects" | "ambience";
}
