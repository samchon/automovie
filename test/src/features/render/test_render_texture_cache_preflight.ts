import { AutoMovieTextureCache } from "@automovie/viewer";
import { assessAutoMovieRenderBudget, autoMovieRenderBudgetEvidence, autoMovieRenderBudgetRefusal } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

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
 */
export const test_render_texture_cache_preflight = async (): Promise<void> => {
  const THREE = await import("three");
  const source = new THREE.DataTexture(new Uint8Array(64), 4, 4);
  const cache = new AutoMovieTextureCache(async () => source);
  const m = material("surface", "image");
  const compiled = compiledShotFixture({ models: [boxModel({ id: "model", materials: [m] })],
    scene: { ...sceneFixture(), lights: [], nodes: [{ ...sceneFixture().nodes[0], model: "model" }] },
  });
  await cache.prime([m.baseColorTexture]);
  TestValidator.equals("host decoded exactly one asset", cache.size, 1);
  TestValidator.equals("host facts retain decoded dimensions", cache.describeSources().map((fact) => [fact.asset, fact.width, fact.height]), [["image", 4, 4]]);
  const assess = () => assessAutoMovieRenderBudget({ compiled, shot: "host-shot", budget: null,
    renderer: { api: "webgl2", vendor: "metadata-unit", device: "no-gpu-observation" },
    settings: { width: 64, height: 64, pixelRatio: 1, shadows: false, shadowType: "none", toneMapping: "none", exposure: 1 },
    assets: [], textures: cache.describeSources(),
  });
  const refusal = (assessment: ReturnType<typeof assess>) => autoMovieRenderBudgetRefusal(
    autoMovieRenderBudgetEvidence({ tier: "unit", budgets: undefined, assessments: [assessment] }),
  );
  const initial = assess();
  TestValidator.equals("owning preflight reads cache storage", initial.inventory!.totals.textureBytes, 64 + 1024);
  TestValidator.equals("supported facts admit", refusal(initial), null);
  Object.assign(source, { minFilter: 999 });
  const unknown = assess();
  TestValidator.equals("unsupported host state is unbounded", unknown.inventory!.totals.textureBytes, null);
  const message = refusal(unknown)!;
  TestValidator.predicate("refusal retains shot and asset", message.includes("host-shot") && message.includes("image"));
  source.minFilter = THREE.NearestFilter;
  const recovered = assess();
  TestValidator.equals("corrected host state recovers", refusal(recovered), null);
  TestValidator.equals("authored material remains bound", m.baseColorTexture, "image");
  TestValidator.predicate("host correction invalidates target", recovered.target!.textureDigest !== unknown.target!.textureDigest);
  await cache.dispose();
};
