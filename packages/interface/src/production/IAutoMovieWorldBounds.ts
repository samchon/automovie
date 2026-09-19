import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * An axis-aligned world-space effect volume.
 *
 * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `IAutoMovieWorldBounds` as the portable data boundary for the production design story boundary requirement.
 * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `IAutoMovieWorldBounds` for the narrative intent story design ownership system contract.
 */
export interface IAutoMovieWorldBounds {
  /**
   * Minimum corner.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `min` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `min` for the narrative intent story design ownership system contract.
   */
  min: IAutoMovieVector3;

  /**
   * Maximum corner.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `max` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `max` for the narrative intent story design ownership system contract.
   */
  max: IAutoMovieVector3;
}
