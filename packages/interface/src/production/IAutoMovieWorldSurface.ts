import { IAutoMovieHeightRule } from "../geometry/IAutoMovieHeightRule";

/**
 * A bounded horizontal polygon with a deterministic height function.
 *
 * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `IAutoMovieWorldSurface` as the portable data boundary for the production design story boundary requirement.
 * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `IAutoMovieWorldSurface` for the narrative intent story design ownership system contract.
 */
export interface IAutoMovieWorldSurface {
  /**
   * Stable surface id.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `id` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `id` for the narrative intent story design ownership system contract.
   */
  id: string;

  /**
   * At least three distinct finite XZ vertices forming a simple,
   * non-self-intersecting polygon with non-zero area.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `polygon` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `polygon` for the narrative intent story design ownership system contract.
   */
  polygon: Array<{
    /** World X in meters. */
    x: number;

    /** World Z in meters. */
    z: number;
  }>;

  /**
   * Surface height function.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `height` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `height` for the narrative intent story design ownership system contract.
   */
  height: IAutoMovieHeightRule;

  /**
   * Whether performers may traverse the surface.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `walkable` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `walkable` for the narrative intent story design ownership system contract.
   */
  walkable: boolean;
}
