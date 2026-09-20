import { IAutoMovieEffectRecipe } from "./IAutoMovieEffectRecipe";
import { IAutoMovieInstanceSetDesign } from "./IAutoMovieInstanceSetDesign";
import { IAutoMovieWorldEffectZone } from "./IAutoMovieWorldEffectZone";
import { IAutoMovieWorldLandmark } from "./IAutoMovieWorldLandmark";
import { IAutoMovieWorldRoute } from "./IAutoMovieWorldRoute";
import { IAutoMovieWorldSurface } from "./IAutoMovieWorldSurface";

/**
 * Named spatial constraints and semantic anchors for a production.
 *
 * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `IAutoMovieWorldDesign` as the portable data boundary for the production design story boundary requirement.
 * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `IAutoMovieWorldDesign` for the narrative intent story design ownership system contract.
 */
export interface IAutoMovieWorldDesign {
  /**
   * Non-blank stable world id.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `id` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `id` for the narrative intent story design ownership system contract.
   */
  id: string;

  /**
   * World unit.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `units` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `units` for the narrative intent story design ownership system contract.
   */
  units: "meter";

  /**
   * Named tactical or narrative landmarks.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `landmarks` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `landmarks` for the narrative intent story design ownership system contract.
   */
  landmarks: IAutoMovieWorldLandmark[];

  /**
   * Queryable surfaces.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `surfaces` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `surfaces` for the narrative intent story design ownership system contract.
   */
  surfaces: IAutoMovieWorldSurface[];

  /**
   * Named formation routes.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `routes` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `routes` for the narrative intent story design ownership system contract.
   */
  routes: IAutoMovieWorldRoute[];

  /**
   * Bounded deterministic environmental-effect recipes.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `effectRecipes` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `effectRecipes` for the narrative intent story design ownership system contract.
   */
  effectRecipes: IAutoMovieEffectRecipe[];

  /**
   * Deterministic effect regions bound to recipes.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `effectZones` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `effectZones` for the narrative intent story design ownership system contract.
   */
  effectZones: IAutoMovieWorldEffectZone[];

  /**
   * Compact non-formation instance sets such as civilians, trees, or debris.
   *
   * Omitted is equivalent to an empty list for backwards compatibility.
   *
   * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `instanceSets` as the portable data boundary for the production design story boundary requirement.
   * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `instanceSets` for the narrative intent story design ownership system contract.
   */
  instanceSets?: IAutoMovieInstanceSetDesign[];
}
