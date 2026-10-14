import type { IAutoMovieRenderTextureSource } from "@automovie/engine";
import {
  assessAutoMovieRenderBudget,
  autoMovieRenderBudgetEvidence,
  autoMovieRenderBudgetRefusal,
} from "@automovie/render";
import { AutoMovieTextureCache } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import type { DataTexture } from "three";

import { compiledShotFixture } from "../internal/renderBudgetFixtures";
import { boxModel, material, sceneFixture } from "../internal/renderFixtures";

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
 *
 * @evidence contracts/testing.md#behavioral-verification Primes the actual cache, supplies its decoded facts to compiled-shot assessment and checks storage, refusal context and target identity before and after unsupported native sampler metadata is corrected.
 * @evidence contracts/testing.md#independent-expectations A 4-by-4 RGBA8 image contributes 64 bytes and the shared PBR lookup contributes 1024; shot and asset diagnostic expectations come from the fixture rather than another assessment.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts supported, unsupported and corrected minification metadata on the same decoded source while preserving the authored image binding and requiring target invalidation.
 * @evidence contracts/testing.md#execution-ownership Owns asynchronous CPU-side Three DataTexture and cache objects, awaits prime and successful-path disposal, and uses a deliberately partial compiled-shot fixture; no WebGL renderer, actual upload or production job gate is exercised, and failure-path cleanup is not asserted here.
 */
export async function test_render_texture_cache_preflight(): Promise<void> {
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
