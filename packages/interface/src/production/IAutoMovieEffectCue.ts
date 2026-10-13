import { AutoMovieFilmTime } from "./AutoMovieFilmTime";

/**
 * Bounded film-global activation of one registered deterministic world effect zone.
 *
 * @evidence contracts/common.md#principled-implementation Exact film time and duration select a half-open interval on the production frame clock, with normalized intensity activating the existing world-zone recipe rather than authoring a separate particle simulation.
 * @evidence contracts/common.md#clear-and-simple-design Zone identity, timing and strength are the whole cue; emission, motion, appearance and hard budgets remain on the reusable world effect recipe.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An absent zone cannot be substituted by a default emitter, and off-grid or out-of-film timing is refused during film assembly rather than shifted to fit.
 * @evidence contracts/common.md#meaningful-documentation Gives stable cue and registered zone identity, the supported world-zone family, film-global exact timing and normalized bounded strength.
 * @author Samchon
 */
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

  /** Finite normalized strength in `[0, 1]`. */
  intensity: number;
}
