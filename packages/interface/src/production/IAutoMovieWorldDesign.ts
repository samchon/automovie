import type { IAutoMovieEffectRecipe } from "./IAutoMovieEffectRecipe";
import type { IAutoMovieInstanceSetDesign } from "./IAutoMovieInstanceSetDesign";
import type { IAutoMovieWorldEffectZone } from "./IAutoMovieWorldEffectZone";
import type { IAutoMovieWorldLandmark } from "./IAutoMovieWorldLandmark";
import type { IAutoMovieWorldRoute } from "./IAutoMovieWorldRoute";
import type { IAutoMovieWorldSurface } from "./IAutoMovieWorldSurface";

/**
 * Production world of named spatial constraints, terrain, environmental effects
 * and compact general populations.
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
