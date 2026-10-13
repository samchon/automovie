import { IAutoMovieCompiledEffect, IAutoMovieCompiledFormation } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { throwsError } from "../internal/predicates";
import { BOX_GEOMETRY_BYTES, BOX_TRIANGLES, BOX_VERTICES, modelsFixture, sceneFixture } from "../internal/renderFixtures";
import { measureRenderBudgetSubject as measure } from "../internal/measureRenderBudgetSubject";

/**
 * Compact formations and particle effects pay their conservative instance and frame-pass bound.
 *
 * Scenarios:
 *
 * 1. Supported population records match independent geometry arithmetic; a formation without a representation refuses.
 */
export const test_render_budget_compact_population = (): void => {
  const formation = {
    id: "crowd",
    anonymousCount: 10,
    chunks: [{}, {}],
    lod: [{ tier: "near", model: "window-model" }],
  } as unknown as IAutoMovieCompiledFormation;

  const effect = {
    id: "haze",
    recipe: { budget: { maxParticles: 5 } },
  } as unknown as IAutoMovieCompiledEffect;

  const compact = measure({
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
      () =>
        measure({
          scene: { ...sceneFixture(), nodes: [], lights: [] },
          models: modelsFixture(),
          formations: [{ ...formation, lod: [] }],
        }),
      "declares no level of detail",
    ),
    true,
  );
};
