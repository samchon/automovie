import type { IAutoMoviePlantingDomain } from "@automovie/interface";

import { plantingRecipe } from "./softFixtures";

/** Build the leafless planting recipe used to isolate branch batching cost. */
export const leaflessPlantingRecipeFixture: () => IAutoMoviePlantingDomain =
  (): IAutoMoviePlantingDomain =>
    plantingRecipe({ budget: { maxBranches: 64, maxLeaves: 0 } });
