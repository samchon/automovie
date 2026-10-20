import { IAutoMovieEffectRecipe } from "./IAutoMovieEffectRecipe";
import { IAutoMovieInstanceSetDesign } from "./IAutoMovieInstanceSetDesign";
import { IAutoMovieWorldEffectZone } from "./IAutoMovieWorldEffectZone";
import { IAutoMovieWorldLandmark } from "./IAutoMovieWorldLandmark";
import { IAutoMovieWorldRoute } from "./IAutoMovieWorldRoute";
import { IAutoMovieWorldSurface } from "./IAutoMovieWorldSurface";

/**
 * Production world of named spatial constraints, terrain, environmental effects and compact general populations.
 *
 * @evidence contracts/common.md#principled-implementation The typed world declares meter-based landmarks, surface height laws, route constraints, effect recipes/zones and instance placement laws. Engine callers query or materialize those records explicitly; unique identities, valid numeric domains and complete references remain caller premises after whole-production admission retirement.
 * @evidence contracts/common.md#clear-and-simple-design Each spatial population keeps its own shape and responsibility, separating terrain lookup, navigation width, effect regions and non-formation placement from shot performance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Optional instanceSets preserves older world records as an empty population. Missing instance routes refuse during regeneration, while materializeCompiledEffects drops unresolved zone or recipe cues; this type supplies no universal missing-reference refusal or invented geometry.
 * @evidence contracts/common.md#meaningful-documentation Defines world identity and meter units, every spatial population and the backward-compatible empty instance-set omission.
 */
export interface IAutoMovieWorldDesign {
  /** Non-blank stable world id. */
  id: string;

  /** World unit. */
  units: "meter";

  /** Named tactical or narrative landmarks. */
  landmarks: IAutoMovieWorldLandmark[];

  /** Queryable surfaces. */
  surfaces: IAutoMovieWorldSurface[];

  /** Named formation routes. */
  routes: IAutoMovieWorldRoute[];

  /** Bounded deterministic environmental-effect recipes. */
  effectRecipes: IAutoMovieEffectRecipe[];

  /** Deterministic effect regions bound to recipes. */
  effectZones: IAutoMovieWorldEffectZone[];

  /**
   * Compact non-formation instance sets such as civilians, trees, or debris.
   *
   * Omitted is equivalent to an empty list for backwards compatibility.
   */
  instanceSets?: IAutoMovieInstanceSetDesign[];
}
