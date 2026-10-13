import { AutoMovieFilmTime } from "./AutoMovieFilmTime";

/** One bounded reference to a registered deterministic world effect zone. */
export interface IAutoMovieEffectCue {
  /** Stable cue id. */
  id: string;

  /** Supported builder-owned recipe family. */
  recipe: "world-zone";

  /** Existing world effect-zone id. */
  zone: string;

  /** Film-global cue start. */
  start: AutoMovieFilmTime;

  /** Cue duration. */
  duration: AutoMovieFilmTime;

  /** Bounded normalized strength. */
  intensity: number;
}
