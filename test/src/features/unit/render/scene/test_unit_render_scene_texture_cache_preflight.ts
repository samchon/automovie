import type { IAutoMovieRenderTextureSource } from "@automovie/interface";
import {
  AutoMovieTextureCache,
  assessAutoMovieRenderBudget,
  autoMovieRenderBudgetEvidence,
  autoMovieRenderBudgetRefusal,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import type { DataTexture } from "three";

import { compiledShotFixture } from "../../../internal/renderBudgetFixtures";
import { boxModel, material, sceneFixture } from "../../../internal/renderFixtures";

/**
 * A host feeds decoded cache objects directly to the owning preflight, without
 * entering byte guesses in authored materials. Recovery changes host facts and
 * the sealed target while preserving the production's material declaration.
 *
 * Scenarios:
 *
 * 1. One real 4-by-4 RGBA8 source yields 64 raw bytes plus the 1024-byte PBR
 *    lookup through cache facts and compiled-shot assessment.
 * 2. Unsupported native sampling refuses with its shot and asset; a corrected
 *    actual texture recovers admission and invalidates its previous target.
 */
export async function test_unit_render_scene_texture_cache_preflight(): Promise<void> {
  const THREE: typeof import("three") = await import("three");
  const source: DataTexture = new THREE.DataTexture(new Uint8Array(64), 4, 4);
  const cache: AutoMovieTextureCache = new AutoMovieTextureCache(
    async (): Promise<DataTexture> => source,
  );
  const m: ReturnType<typeof material> = material("surface", "image");
  const compiled: ReturnType<typeof compiledShotFixture> = compiledShotFixture({
    models: [boxModel({ id: "model", materials: [m] })],
    scene: {
      ...sceneFixture(),
      lights: [],
      nodes: [{ ...sceneFixture().nodes[0], model: "model" }],
    },
  });
  await cache.prime([m.baseColorTexture]);
  TestValidator.equals("host decoded exactly one asset", cache.size, 1);
  TestValidator.equals(
    "host facts retain decoded dimensions",
    cache
      .describeSources()
      .map((fact: IAutoMovieRenderTextureSource): [string, number, number] => [
        fact.asset,
        fact.width,
        fact.height,
      ]),
    [["image", 4, 4]],
  );
  const assess: () => ReturnType<
    typeof assessAutoMovieRenderBudget
  > = (): ReturnType<typeof assessAutoMovieRenderBudget> =>
    assessAutoMovieRenderBudget({
      compiled,
      shot: "host-shot",
      budget: null,
      renderer: {
        api: "webgl2",
        vendor: "metadata-unit",
        device: "no-gpu-observation",
      },
      settings: {
        width: 64,
        height: 64,
        pixelRatio: 1,
        shadows: false,
        shadowType: "none",
        toneMapping: "none",
        exposure: 1,
      },
      assets: [],
      textures: cache.describeSources(),
    });
  const refusal: (assessment: ReturnType<typeof assess>) => string | null = (
    assessment: ReturnType<typeof assess>,
  ): string | null =>
    autoMovieRenderBudgetRefusal(
      autoMovieRenderBudgetEvidence({
        tier: "unit",
        budgets: undefined,
        assessments: [assessment],
      }),
    );
  const initial: ReturnType<typeof assess> = assess();
  TestValidator.equals(
    "owning preflight reads cache storage",
    initial.inventory!.totals.textureBytes,
    64 + 1024,
  );
  TestValidator.equals("supported facts admit", refusal(initial), null);
  Object.assign(source, { minFilter: 999 });
  const unknown: ReturnType<typeof assess> = assess();
  TestValidator.equals(
    "unsupported host state is unbounded",
    unknown.inventory!.totals.textureBytes,
    null,
  );
  const message: string = refusal(unknown)!;
  TestValidator.predicate(
    "refusal retains shot and asset",
    message.includes("host-shot") && message.includes("image"),
  );
  source.minFilter = THREE.NearestFilter;
  const recovered: ReturnType<typeof assess> = assess();
  TestValidator.equals(
    "corrected host state recovers",
    refusal(recovered),
    null,
  );
  TestValidator.equals(
    "authored material remains bound",
    m.baseColorTexture,
    "image",
  );
  TestValidator.predicate(
    "host correction invalidates target",
    recovered.target!.textureDigest !== unknown.target!.textureDigest,
  );
  await cache.dispose();
}
