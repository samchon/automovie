import { IAutoMovieRenderSubject } from "@automovie/engine";
import { flatBasin } from "./fluidFixtures";
import { modelsFixture } from "./renderFixtures";
import { plantingCluster, softPanel } from "./softFixtures";
import { simulatedRenderSceneFixture } from "./simulatedRenderSceneFixture";
import { leaflessPlantingRecipeFixture } from "./leaflessPlantingRecipeFixture";

const scene = simulatedRenderSceneFixture;
const bareRecipe = leaflessPlantingRecipeFixture;

/** The stated branch prototype is input data, independent of measured output. */
const BRANCH = { vertices: 40, triangles: 24 };

/** Build the composed render subject used by resource-budget scenarios. */
export const simulatedRenderSubjectFixture = (): IAutoMovieRenderSubject => ({
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
