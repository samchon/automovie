import { IAutoMovieWorldDesign } from "@automovie/interface";
import { filmEffectRecipe } from "./filmEffectRecipe";
import { filmEffectZone } from "./filmEffectZone";
/** Return the existing one-recipe, yard/gate-zone world, preserving zone order and seed contrast. The subordinate factories create fresh records for each call; no production registry or renderer is installed. */
export const filmEffectWorld: () => IAutoMovieWorldDesign = (): IAutoMovieWorldDesign => ({
  id: "world",
  units: "meter",
  landmarks: [],
  surfaces: [],
  routes: [],
  effectRecipes: [filmEffectRecipe()],
  effectZones: [
    filmEffectZone("yard"),
    filmEffectZone("gate", "fog-recipe", 5),
  ],
});
