import type { IAutoMovieFilmTime } from "./IAutoMovieFilmTime";

/**
 * Bounded film-global activation of one registered deterministic world effect
 * zone.
 */
export interface IAutoMovieEffectCue {
  /** Stable cue id. */
  id: string;

  /** Supported builder-owned recipe family. */
  recipe: "world-zone";

  /** Existing world effect-zone id. */
  zone: string;

  /** Film-global cue start. */
  start: IAutoMovieFilmTime;

  /** Cue duration. */
  duration: IAutoMovieFilmTime;

  /** Finite normalized strength in `[0, 1]`. */
  intensity: number;
}
