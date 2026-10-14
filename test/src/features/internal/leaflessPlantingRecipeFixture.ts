import { plantingRecipe } from "./softFixtures";
import type { IAutoMoviePlantingDomain } from "@automovie/interface";

/** Build the leafless planting recipe used to isolate branch batching cost. */
export const leaflessPlantingRecipeFixture: () => IAutoMoviePlantingDomain = (): IAutoMoviePlantingDomain =>
    plantingRecipe({ budget: { maxBranches: 64, maxLeaves: 0 } });
