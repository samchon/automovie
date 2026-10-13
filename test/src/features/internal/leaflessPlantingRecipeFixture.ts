import { plantingRecipe } from "./softFixtures";

/** Build the leafless planting recipe used to isolate branch batching cost. */
export const leaflessPlantingRecipeFixture = () =>
    plantingRecipe({ budget: { maxBranches: 64, maxLeaves: 0 } });
