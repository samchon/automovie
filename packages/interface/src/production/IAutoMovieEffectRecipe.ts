import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One bounded deterministic environmental-effect emitter recipe.
 *
 * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `IAutoMovieEffectRecipe` as the portable data boundary for the production design story boundary requirement.
 * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `IAutoMovieEffectRecipe` for the narrative intent story design ownership system contract.
 */
export interface IAutoMovieEffectRecipe {
  /**
   * Stable recipe id.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `id` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `id` for the narrative intent story design ownership system contract.
   */
  id: string;
  /**
   * Supported primitive effect family.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `kind` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `kind` for the narrative intent story design ownership system contract.
   */
  kind: "fog" | "smoke" | "dust";
  /**
   * Explicit deterministic recipe seed.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `seed` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `seed` for the narrative intent story design ownership system contract.
   */
  seed: number;
  /**
   * Bounded deterministic emission.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `emission` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `emission` for the narrative intent story design ownership system contract.
   */
  emission: {
    /** Particles emitted per second. */
    rate: number;
    /** Particles emitted at cue start. */
    burst: number;
    /** Maximum emitting duration in seconds. */
    duration: number;
  };
  /**
   * Bounded billboard appearance.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `particle` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `particle` for the narrative intent story design ownership system contract.
   */
  particle: {
    /** Inclusive lifetime range in seconds. */
    lifetime: { min: number; max: number };
    /** Inclusive world-size range in meters. */
    size: { min: number; max: number };
    /** Exact opaque hexadecimal RGB color. */
    color: string;
    /** Inclusive alpha range from zero through one. */
    opacity: { min: number; max: number };
  };
  /**
   * Bounded deterministic transport.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `motion` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `motion` for the narrative intent story design ownership system contract.
   */
  motion: {
    /** World-space meters per second. */
    wind: IAutoMovieVector3;
    /** Additional upward meters per second. */
    rise: number;
    /** Maximum seeded lateral velocity deviation. */
    turbulence: number;
  };
  /**
   * Hard runtime and LOD budgets.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `budget` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `budget` for the narrative intent story design ownership system contract.
   */
  budget: {
    /** Maximum live billboard instances. */
    maxParticles: number;
    /** Distance beyond which deterministic thinning applies. */
    lodDistance: number;
  };
  /**
   * Only supported transparency law.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `blend` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `blend` for the narrative intent story design ownership system contract.
   */
  blend: "alpha";
}
