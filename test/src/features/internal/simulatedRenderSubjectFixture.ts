import { IAutoMovieRenderSubject } from "@automovie/engine";

import { flatBasin } from "./fluidFixtures";
import { leaflessPlantingRecipeFixture } from "./leaflessPlantingRecipeFixture";
import { modelsFixture } from "./renderFixtures";
import { simulatedRenderSceneFixture } from "./simulatedRenderSceneFixture";
import { plantingCluster, softPanel } from "./softFixtures";

const scene: typeof simulatedRenderSceneFixture = simulatedRenderSceneFixture;
const bareRecipe: typeof leaflessPlantingRecipeFixture =
  leaflessPlantingRecipeFixture;

/** The stated branch prototype is input data, independent of measured output. */
const BRANCH: { vertices: number; triangles: number } = {
  vertices: 40,
  triangles: 24,
};

/** Build the composed render subject used by resource-budget scenarios. */
export const simulatedRenderSubjectFixture: () => IAutoMovieRenderSubject =
  (): IAutoMovieRenderSubject => ({
    scene: scene(),
    models: modelsFixture(),
    softBodies: [
      {
        domain: softPanel({ columns: 4, rows: 3 }),
        owner: "space:tower/ground-hall",
        material: "oak",
      },
    ],
    plantings: [
      {
        domain: bareRecipe(),
        cluster: plantingCluster(),
        owner: "space:tower/ground-hall",
        branchMaterial: null,
        leafMaterial: null,
        branch: BRANCH,
        leaf: null,
      },
    ],
    waterBodies: [
      {
        id: "atrium-pool",
        owner: "space:tower/ground-hall",
        nodes: [],
        domain: flatBasin({ columns: 3, rows: 2, depth: 1 }),
        cells: null,
        particles: null,
        material: null,
      },
    ],
  });
