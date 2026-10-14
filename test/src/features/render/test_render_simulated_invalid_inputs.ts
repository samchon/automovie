import { IAutoMovieRenderSubject } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";
import type { IAutoMoviePlantingDomain, IAutoMovieRenderInventory } from "@automovie/interface";
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
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual render inventory through six refusal callbacks and checks the named error fragments, catching missing or conflicting material references accepted for simulated drawables and fractional or negative prototype counts multiplied into a report.
 * @evidence contracts/testing.md#independent-expectations Absent velvet is not declared by the model fixture; the conflicting stone record deliberately changes roughness and the literal diagnostic names all declaring models. Integer vertex/triangle cardinality excludes 1.5 and -1 independently of any measured inventory output.
 * @evidence contracts/testing.md#distinguishing-cases Covers absent panel, leaf and water materials separately, conflicting panel material, fractional vertices and negative triangles. Valid named/default material and positive prototype neighbours are exercised by the simulated budget, shared-material and foliage tests; this unit retains every refusal's existing message requirements.
 * @evidence contracts/testing.md#execution-ownership The exported test_render_simulated_invalid_inputs entry owns six synchronous namedFacts cases over in-memory domains and models; each reaches real engine admission without replacing globals, creating native geometry, starting a renderer or installing a consumer.
 */
export function test_render_simulated_invalid_inputs(): void {
  const scene: typeof simulatedRenderSceneFixture = simulatedRenderSceneFixture;
  const bareRecipe: typeof leaflessPlantingRecipeFixture = leaflessPlantingRecipeFixture;

  const BRANCH: { vertices: number; triangles: number } = { vertices: 40, triangles: 24 };

  const LEAF: { vertices: number; triangles: number } = { vertices: 4, triangles: 2 };

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

  /** One cluster whose branch prototype carries the stated cost. */
  const prototyped: (branch: { vertices: number; triangles: number }) => IAutoMovieRenderSubject = (branch: {
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
        (): boolean =>
          throwsError(
            (): IAutoMovieRenderInventory =>
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
        (): boolean =>
          throwsError(
            (): IAutoMovieRenderInventory =>
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
        (): boolean =>
          throwsError(
            (): IAutoMovieRenderInventory =>
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
        (): boolean =>
          throwsError(
            (): IAutoMovieRenderInventory =>
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
        (): boolean =>
          throwsError(
            (): IAutoMovieRenderInventory => measure(prototyped({ vertices: 1.5, triangles: 1 })),
            "vertices must be a safe integer",
          ),
      ],
      [
        "negative prototype",
        (): boolean =>
          throwsError(
            (): IAutoMovieRenderInventory => measure(prototyped({ vertices: 1, triangles: -1 })),
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
}
