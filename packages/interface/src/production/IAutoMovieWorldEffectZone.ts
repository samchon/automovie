import { IAutoMovieWorldBounds } from "./IAutoMovieWorldBounds";

/**
 * An axis-aligned world-space effect volume.
 *
 * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `IAutoMovieWorldEffectZone` as the portable data boundary for the production design story boundary requirement.
 * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `IAutoMovieWorldEffectZone` for the narrative intent story design ownership system contract.
 */
export interface IAutoMovieWorldEffectZone {
  /**
   * Stable zone id.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `id` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `id` for the narrative intent story design ownership system contract.
   */
  id: string;
  /**
   * Existing deterministic effect recipe id.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `recipe` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `recipe` for the narrative intent story design ownership system contract.
   */
  recipe: string;
  /**
   * World-space volume.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `bounds` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `bounds` for the narrative intent story design ownership system contract.
   */
  bounds: IAutoMovieWorldBounds;
  /**
   * Explicit deterministic zone seed.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `seed` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `seed` for the narrative intent story design ownership system contract.
   */
  seed: number;
}
