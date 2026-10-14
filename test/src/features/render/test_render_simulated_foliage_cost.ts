import { plantingBudget } from "@automovie/engine";
import type {
  IAutoMoviePlantingDomain,
  IAutoMovieRenderInventory,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { leaflessPlantingRecipeFixture } from "../internal/leaflessPlantingRecipeFixture";
import { measureRenderBudgetSubject as measure } from "../internal/measureRenderBudgetSubject";
import { modelsFixture } from "../internal/renderFixtures";
import { simulatedRenderSceneFixture } from "../internal/simulatedRenderSceneFixture";
import { plantingCluster, plantingRecipe } from "../internal/softFixtures";

/**
 * A leaf-bearing planting recipe pays a second batch and prototype storage.
 *
 * Scenarios:
 *
 * 1. A supported leafy cluster draws both populations, while a leafless cluster retains only its branch batch.
 *
 * @evidence contracts/testing.md#behavioral-verification Measures leafless and foliated subjects and compares draw, slot, triangle, vertex, prototype-byte and material costs, detecting an omitted leaf batch or prototype, per-instance buffer duplication or a leafless default material charged without a draw.
 * @evidence contracts/testing.md#independent-expectations Branch population is independently seven branches times six cluster members, while branch and leaf prototype counts are authored inputs with explicit attribute/index byte widths. Leaf population comes from the separate plantingBudget owner, so this test checks inventory multiplication and batching rather than independently proving that owner's recurrence; leaves greater than zero prevents a vacuous leafy case.
 * @evidence contracts/testing.md#distinguishing-cases Leafless and positive-leaf recipes distinguish one versus two batches and materials, shared per-prototype storage versus repeated instance vertices, and two frame submissions versus resident slot count. Unknown prototype and malformed count admission belong to their separate simulated tests.
 * @evidence contracts/testing.md#execution-ownership The discoverable exported test_render_simulated_foliage_cost entry invokes plantingBudget and the engine inventory synchronously over numerical domains, creating no plant meshes, native buffers, renderer, installed consumer or dynamic cases.
 */
export function test_render_simulated_foliage_cost(): void {
  const scene: typeof simulatedRenderSceneFixture = simulatedRenderSceneFixture;
  const bareRecipe: typeof leaflessPlantingRecipeFixture =
    leaflessPlantingRecipeFixture;

  // A complete two-child tree of three levels is 1 + 2 + 4 branches, and the
  // cluster places six members of it.
  const BRANCH_INSTANCES: number = 7 * 6;

  const BRANCH: { vertices: number; triangles: number } = {
    vertices: 40,
    triangles: 24,
  };

  const LEAF: { vertices: number; triangles: number } = {
    vertices: 4,
    triangles: 2,
  };

  const BRANCH_BYTES: number =
    BRANCH.vertices * (12 + 12 + 8) + BRANCH.triangles * 3 * 4;

  const LEAF_BYTES: number =
    LEAF.vertices * (12 + 12 + 8) + LEAF.triangles * 3 * 4;

  // Opaque geometry is submitted more than once in a frame, and the inventory
  // reports the conservative one-frame peak rather than the beauty pass alone.
  // These scenes light nothing, so no shadow map re-submits the geometry and
  // the outline guide pass is the frame-wide peak instead: one further
  // complete pass over every opaque draw. Resident cost is not multiplied,
  // because vertices, memory, nodes and instance slots are allocated once and
  // reused by each pass.
  const PASSES: 2 = 2 as const;

  const unstated: IAutoMovieRenderInventory = measure({
    scene: scene(),
    models: modelsFixture(),
    plantings: [
      {
        domain: bareRecipe(),
        cluster: plantingCluster(),
        owner: null,
        branchMaterial: null,
        leafMaterial: null,
        branch: null,
        leaf: null,
      },
    ],
  });

  // A leafy cluster submits a second batch and pays a second material; a
  // leafless one pays for neither.
  const leafy: IAutoMoviePlantingDomain = plantingRecipe({
    foliage: {
      density: 2,
      minLevel: 1,
      size: { x: 0.125, y: 0.0625, z: 0.125 },
      scaleJitter: 0,
      rollJitter: 0,
    },
    budget: { maxBranches: 64, maxLeaves: 32 },
  });

  // The law relating a recipe to its leaf count belongs to the planting domain,
  // not to the inventory; what is under test here is that the inventory
  // multiplies that declared worst case by the prototype the renderer builds.
  const leaves: number = plantingBudget({
    domain: leafy,
    cluster: plantingCluster(),
  }).worstCaseLeafInstances;

  const foliated: IAutoMovieRenderInventory = measure({
    scene: scene(),
    models: modelsFixture(),
    plantings: [
      {
        domain: leafy,
        cluster: plantingCluster(),
        owner: null,
        branchMaterial: "oak",
        leafMaterial: null,
        branch: BRANCH,
        leaf: LEAF,
      },
    ],
  });

  TestValidator.equals(
    "a leafy cluster draws a second batch and a leafless one does not",
    {
      leafy: {
        drawCalls: foliated.totals.drawCalls,
        instanceSlots: foliated.totals.instanceSlots,
        triangles: foliated.totals.triangles,
        vertices: foliated.totals.vertices,
        geometryBytes: foliated.totals.geometryBytes,
        materials: foliated.totals.materials,
      },
      bare: {
        drawCalls: unstated.totals.drawCalls,
        materials: unstated.totals.materials,
      },
      // A leaf-bearing recipe has to actually bear leaves, or this case would
      // prove the second batch exists by never asking for one.
      bearing: leaves > 0,
    },
    {
      leafy: {
        // A branch batch and a leaf batch, each submitted once per pass.
        drawCalls: PASSES * 2,
        instanceSlots: BRANCH_INSTANCES + leaves,
        triangles:
          PASSES *
          (BRANCH_INSTANCES * BRANCH.triangles + leaves * LEAF.triangles),
        vertices: BRANCH_INSTANCES * BRANCH.vertices + leaves * LEAF.vertices,
        geometryBytes: BRANCH_BYTES + LEAF_BYTES,
        materials: 2,
      },
      bare: { drawCalls: PASSES * 1, materials: 1 },
      bearing: true,
    },
  );
}
