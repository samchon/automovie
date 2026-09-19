/**
 * One distance-specific recipe reference emitted as authoring/runtime metadata.
 *
 * The foundation builder materializes every referenced recipe. The scaffold
 * viewer automatically selects anonymous formation tiers from distance and
 * projected contribution with hysteresis; ordinary scene nodes do not yet
 * switch model tiers automatically.
 *
 * @evidence requirements/production-design/art-direction-and-visual-language.md#production-design-reference-realization Exposes `IAutoMovieModelLodRecipe` as the portable data boundary for the production design reference realization requirement.
 * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-design-reference-realization Types `IAutoMovieModelLodRecipe` for the narrative intent design reference realization system contract.
 */
export interface IAutoMovieModelLodRecipe {
  /**
   * Detail tier.
   *
   * @evidence requirements/production-design/art-direction-and-visual-language.md#production-design-reference-realization Exposes `tier` as the portable data boundary for the production design reference realization requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-design-reference-realization Types `tier` for the narrative intent design reference realization system contract.
   */
  tier: "hero" | "near" | "far";

  /**
   * Positive maximum viewing distance in meters, strictly increasing between
   * tiers, or null only on the final unbounded tier.
   *
   * @evidence requirements/production-design/art-direction-and-visual-language.md#production-design-reference-realization Exposes `maxDistance` as the portable data boundary for the production design reference realization requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-design-reference-realization Types `maxDistance` for the narrative intent design reference realization system contract.
   */
  maxDistance: number | null;

  /**
   * Existing recipe id used at this tier; self-reference is allowed.
   *
   * @evidence requirements/production-design/art-direction-and-visual-language.md#production-design-reference-realization Exposes `recipe` as the portable data boundary for the production design reference realization requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-design-reference-realization Types `recipe` for the narrative intent design reference realization system contract.
   */
  recipe: string;
}
