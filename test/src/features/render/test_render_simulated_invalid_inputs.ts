import { IAutoMovieRenderSubject } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";
import { flatBasin } from "../internal/fluidFixtures";
import { namedFacts, throwsError } from "../internal/predicates";
import { boxModel, material, modelsFixture } from "../internal/renderFixtures";
import { plantingCluster, plantingRecipe, softPanel } from "../internal/softFixtures";
import { simulatedRenderSceneFixture } from "../internal/simulatedRenderSceneFixture";
import { leaflessPlantingRecipeFixture } from "../internal/leaflessPlantingRecipeFixture";
import { measureRenderBudgetSubject as measure } from "../internal/measureRenderBudgetSubject";

/**
 * Invalid simulated material and prototype records refuse without selecting an arbitrary definition.
 *
 * Scenarios:
 *
 * 1. Missing panel, leaf and water materials, conflicting material declarations and malformed prototype counts each name their refusal.
 */
export const test_render_simulated_invalid_inputs = (): void => {
  const scene = simulatedRenderSceneFixture;
  const bareRecipe = leaflessPlantingRecipeFixture;

  const BRANCH = { vertices: 40, triangles: 24 };

  const LEAF = { vertices: 4, triangles: 2 };

  // A leafy cluster submits a second batch and pays a second material; a
  // leafless one pays for neither.
  const leafy = plantingRecipe({
    foliage: {
      density: 2,
      minLevel: 1,
      size: { x: 0.125, y: 0.0625, z: 0.125 },
      scaleJitter: 0,
      rollJitter: 0,
    },
    budget: { maxBranches: 64, maxLeaves: 32 },
  });

  /** One cluster whose branch prototype carries the stated cost. */
  const prototyped = (branch: {
    vertices: number;
    triangles: number;
  }): IAutoMovieRenderSubject => ({
    scene: scene(),
    models: modelsFixture(),
    plantings: [
      {
        domain: bareRecipe(),
        cluster: plantingCluster(),
        owner: null,
        branchMaterial: null,
        leafMaterial: null,
        branch,
        leaf: null,
      },
    ],
  });

  TestValidator.equals(
    "an unresolvable material and a malformed prototype are each refused",
    namedFacts([
      [
        "absent panel material",
        () =>
          throwsError(
            () =>
              measure({
                scene: scene(),
                models: modelsFixture(),
                softBodies: [
                  {
                    domain: softPanel({ columns: 2, rows: 2 }),
                    owner: null,
                    material: "velvet",
                  },
                ],
              }),
            'material "velvet" is absent',
          ),
      ],
      [
        "absent leaf material",
        () =>
          throwsError(
            () =>
              measure({
                scene: scene(),
                models: modelsFixture(),
                plantings: [
                  {
                    domain: leafy,
                    cluster: plantingCluster(),
                    owner: null,
                    branchMaterial: null,
                    leafMaterial: "velvet",
                    branch: BRANCH,
                    leaf: LEAF,
                  },
                ],
              }),
            'material "velvet" is absent',
          ),
      ],
      [
        "absent water material",
        () =>
          throwsError(
            () =>
              measure({
                scene: scene(),
                models: modelsFixture(),
                waterBodies: [
                  {
                    id: "pool",
                    owner: null,
                    nodes: [],
                    domain: flatBasin({ columns: 2, rows: 2, depth: 1 }),
                    cells: null,
                    particles: null,
                    material: "velvet",
                  },
                ],
              }),
            'material "velvet" is absent',
          ),
      ],
      [
        "conflicting panel material",
        () =>
          throwsError(
            () =>
              measure({
                scene: scene(),
                models: [
                  ...modelsFixture(),
                  boxModel({
                    id: "z-conflict",
                    materials: [{ ...material("stone"), roughness: 0.25 }],
                  }),
                ],
                softBodies: [
                  {
                    domain: softPanel({ columns: 2, rows: 2 }),
                    owner: null,
                    material: "stone",
                  },
                ],
              }),
            [
              'soft body "panel"',
              'material "stone" has conflicting definitions',
              '"slab-model", "wall-model", "z-conflict"',
            ],
          ),
      ],
      [
        "fractional prototype",
        () =>
          throwsError(
            () => measure(prototyped({ vertices: 1.5, triangles: 1 })),
            "vertices must be a safe integer",
          ),
      ],
      [
        "negative prototype",
        () =>
          throwsError(
            () => measure(prototyped({ vertices: 1, triangles: -1 })),
            "triangles must be a safe integer",
          ),
      ],
    ]),
    {
      "absent panel material": true,
      "absent leaf material": true,
      "absent water material": true,
      "conflicting panel material": true,
      "fractional prototype": true,
      "negative prototype": true,
    },
  );
};
