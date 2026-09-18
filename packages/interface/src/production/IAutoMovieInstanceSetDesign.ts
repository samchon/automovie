import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { IAutoMovieInstancePrototypeDesign } from "./IAutoMovieInstancePrototypeDesign";
import { IAutoMovieInstanceSetLayout } from "./IAutoMovieInstanceSetLayout";
import { IAutoMovieInstanceVariation } from "./IAutoMovieInstanceVariation";

/**
 * A compact non-formation crowd, vegetation, prop, or debris set.
 *
 * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `IAutoMovieInstanceSetDesign` as the portable data boundary for the production design story boundary requirement.
 * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `IAutoMovieInstanceSetDesign` for the narrative intent story design ownership system contract.
 */
export interface IAutoMovieInstanceSetDesign {
  /**
   * Stable id unique within the world.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `id` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `id` for the narrative intent story design ownership system contract.
   */
  id: string;
  /**
   * Existing model recipe rendered by every member.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `modelRecipe` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `modelRecipe` for the narrative intent story design ownership system contract.
   */
  modelRecipe: string;
  /**
   * Optional weighted prototype table; `modelRecipe` remains the default.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `prototypes` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `prototypes` for the narrative intent story design ownership system contract.
   */
  prototypes?: IAutoMovieInstancePrototypeDesign[];
  /**
   * Integer slot count from one through 100,000.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `count` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `count` for the narrative intent story design ownership system contract.
   */
  count: number;
  /**
   * Compact deterministic placement law.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `layout` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `layout` for the narrative intent story design ownership system contract.
   */
  layout: IAutoMovieInstanceSetLayout;
  /**
   * World-space origin for grid and scatter layouts.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `anchor` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `anchor` for the narrative intent story design ownership system contract.
   */
  anchor: IAutoMovieVector3;
  /**
   * Finite base heading in degrees.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `facingDeg` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `facingDeg` for the narrative intent story design ownership system contract.
   */
  facingDeg: number;
  /**
   * Full non-negative safe-integer seed.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `seed` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `seed` for the narrative intent story design ownership system contract.
   */
  seed: number;
  /**
   * Seed-derived per-slot differences.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `variation` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `variation` for the narrative intent story design ownership system contract.
   */
  variation: IAutoMovieInstanceVariation;
}
