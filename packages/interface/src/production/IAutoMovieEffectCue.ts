import { AutoMovieFilmTime } from "./AutoMovieFilmTime";

/**
 * Bounded film-global activation of one registered deterministic world effect zone.
 *
 * @evidence contracts/development/design.md#principled-representation Authored film time and duration describe an intended half-open activation. The production edit normalizer is retired; Engine materializeProductionFilmEffects instead consumes already-normalized timeline frames and explicitly validates cue identity, interval, intensity, zone/recipe membership and ownership conflicts.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Zone identity, timing and strength are the whole cue; emission, motion, appearance and hard budgets remain on the reusable world effect recipe.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This authoring record performs no time-grid or film-duration check. The explicit normalized Engine materializer rejects missing zones/recipes and unsafe or nonpositive intervals rather than substituting an emitter; the host must normalize time and enforce total-film extent.
 * @evidence contracts/development/common.md#meaningful-documentation Gives stable cue and registered zone identity, the supported world-zone family, film-global exact timing and normalized bounded strength.
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
