import { IAutoMovieEffectRecipe } from "./IAutoMovieEffectRecipe";
import { IAutoMovieInstanceSetDesign } from "./IAutoMovieInstanceSetDesign";
import { IAutoMovieWorldEffectZone } from "./IAutoMovieWorldEffectZone";
import { IAutoMovieWorldLandmark } from "./IAutoMovieWorldLandmark";
import { IAutoMovieWorldRoute } from "./IAutoMovieWorldRoute";
import { IAutoMovieWorldSurface } from "./IAutoMovieWorldSurface";

/** Named spatial constraints and semantic anchors for a production. */
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
