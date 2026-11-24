import {
  IAutoMovieCompiledEffect,
  IAutoMovieCompiledFormation,
  IAutoMovieRenderInventory,
  IAutoMovieRenderModelCost,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { measureRenderBudgetSubject as measure } from "../../../internal/measureRenderBudgetSubject";
import { throwsError } from "../../../internal/predicates";
import {
  BOX_GEOMETRY_BYTES,
  BOX_TRIANGLES,
  BOX_VERTICES,
  boxModel,
  instanceSetFixture,
  modelsFixture,
  sceneFixture,
} from "../../../internal/renderFixtures";

/**
 * Compact formations and particle effects pay their conservative instance and frame-pass bound.
 *
 * Scenarios:
 *
 * 1. Supported population records match independent geometry arithmetic; a formation without a representation refuses.
 * 2. A later, more expensive instance tier sets the per-slot frame bound and remains in resident prototype geometry; a missing later tier model refuses.
 */
export function test_unit_render_scene_budget_compact_population(): void {
  const formation: IAutoMovieCompiledFormation = {
    id: "crowd",
    anonymousCount: 10,
    chunks: [{}, {}],
    lod: [{ tier: "near", runtimeModel: "window-model" }],
  } as unknown as IAutoMovieCompiledFormation;

  const effect: IAutoMovieCompiledEffect = {
    id: "haze",
    recipe: { budget: { maxParticles: 5 } },
  } as unknown as IAutoMovieCompiledEffect;

  const compact: IAutoMovieRenderInventory = measure({
    scene: { ...sceneFixture(), nodes: [], lights: [] },
    models: modelsFixture(),
    formations: [formation],
    effects: [effect],
  });

  TestValidator.equals(
    "compact formations, effects, and the largest frame pass are bounded",
    compact.totals,
    {
      triangles: 2 * (10 * BOX_TRIANGLES + 5 * 2),
      vertices: 10 * BOX_VERTICES + 5 * 4,
      drawCalls: 2 * (2 + 1),
      materials: 2,
      textures: 1,
      textureBytes: 1024,
      geometryBytes: BOX_GEOMETRY_BYTES + 4 * (12 + 12 + 8) + 6 * 4,
      lights: 0,
      shadowMaps: 0,
      nodes: 2,
      instanceSets: 0,
      instanceSlots: 15,
      instanceChunks: 2,
      fluidCells: 0,
      fluidParticles: 0,
    },
  );

  TestValidator.equals(
    "a formation without a representation is not priced as zero",
    throwsError(
      (): IAutoMovieRenderInventory =>
        measure({
          scene: { ...sceneFixture(), nodes: [], lights: [] },
          models: modelsFixture(),
          formations: [{ ...formation, lod: [] }],
        }),
      "declares no level of detail",
    ),
    true,
  );
  const set: ReturnType<typeof instanceSetFixture> = instanceSetFixture({
    id: "nonmonotone",
    count: 2,
    chunks: 1,
    model: "near-small",
  });
  set.lod = [
    { ...set.lod[0]!, maxDistance: 10 },
    {
      ...set.lod[0]!,
      tier: "far",
      maxDistance: null,
      runtimeModel: "far-heavy",
    },
  ];
  const population: ReturnType<typeof measure> = measure({
    scene: { ...sceneFixture(), nodes: [], lights: [] },
    models: [
      boxModel({ id: "near-small" }),
      boxModel({ id: "far-heavy", parts: 2 }),
    ],
    instanceSets: [set],
  });
  TestValidator.equals(
    "all applicable tiers determine the actual conservative frame bound",
    {
      triangles: population.totals.triangles,
      vertices: population.totals.vertices,
      drawCalls: population.totals.drawCalls,
      geometryBytes: population.totals.geometryBytes,
      models: population.models.map(
        (model: IAutoMovieRenderModelCost): string => model.model,
      ),
    },
    {
      triangles: 8 * BOX_TRIANGLES,
      vertices: 4 * BOX_VERTICES,
      drawCalls: 4,
      geometryBytes: 3 * BOX_GEOMETRY_BYTES,
      models: ["far-heavy", "near-small"],
    },
  );
  TestValidator.predicate(
    "an unresolved later tier cannot be silently ignored",
    (): boolean =>
      throwsError(
        (): IAutoMovieRenderInventory =>
          measure({
            scene: { ...sceneFixture(), nodes: [], lights: [] },
            models: [boxModel({ id: "near-small" })],
            instanceSets: [set],
          }),
        'model "far-heavy" is absent',
      ),
  );
}
