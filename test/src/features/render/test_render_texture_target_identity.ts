import { autoMovieRenderTextureDigest, compareAutoMovieRenderTarget, deriveAutoMovieSemanticMask, evaluateAutoMovieRenderBudget, sealAutoMovieRenderTarget } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";
import { sceneFixture } from "../internal/renderFixtures";

/**
 * Upload storage can change without changing encoded asset bytes. Targets must
 * name those host facts and invalidate a previously measured budget.
 *
 * Scenarios:
 *
 * 1. Asset and property order, and identical duplicate facts, preserve identity.
 * 2. Format, extents, mip policy, sampler and missing facts change identity;
 *    conflicting duplicate facts refuse rather than accepting insertion order.
 * 3. A host upload digest seals a version-two target; legacy targets remain
 *    version one, and digest/protocol drift makes the same report stale.
 */
export const test_render_texture_target_identity = (): void => {
  const a = { asset: "a", width: 4, height: 4, mipmapped: false, format: "rgba8" as const };
  const b = { ...a, asset: "b" };
  const digest = autoMovieRenderTextureDigest([a, b]);
  TestValidator.equals("asset ordering", autoMovieRenderTextureDigest([b, a]), digest);
  TestValidator.equals("equivalent duplicates", autoMovieRenderTextureDigest([a, b, a]), digest);
  TestValidator.equals("equivalent copied descriptors", autoMovieRenderTextureDigest([a, b, { ...a }]), digest);
  TestValidator.predicate("conflicting actual source identity refuses", throwsError(() => autoMovieRenderTextureDigest([
    { ...a, sourceIdentity: "first" }, { ...a, sourceIdentity: "second" },
  ]), "conflicting"));
  TestValidator.equals("property ordering", autoMovieRenderTextureDigest([{ format: a.format, mipmapped: false, height: 4, width: 4, asset: "a" }, b]), digest);
  for (const change of [
    { format: "rgba16f" as const }, { width: 8 }, { height: 2 }, { width: NaN },
    { mipmapped: true }, { generateMipmaps: true }, { explicitMipmaps: true },
    { sampler: { wrapS: "repeat" as const, wrapT: "clamp" as const, minFilter: "linear" as const, magFilter: "nearest" as const } },
    { format: undefined },
  ]) {
    TestValidator.predicate("upload fact changes identity", autoMovieRenderTextureDigest([{ ...a, ...change }, b]) !== digest);
    TestValidator.predicate("conflicting identity refuses", throwsError(() => autoMovieRenderTextureDigest([a, { ...a, ...change }]), "a"));
  }
  const props = { renderer: { api: "webgl2", vendor: "test", device: "gpu" },
    settings: { width: 64, height: 64, pixelRatio: 1, shadows: false,
      shadowType: "none" as const, toneMapping: "none" as const, exposure: 1 }, assets: [],
  };
  const old = sealAutoMovieRenderTarget(props);
  const current = sealAutoMovieRenderTarget({ ...props, textureDigest: digest });
  TestValidator.equals("legacy protocol", old.protocol, "automovie.render-target.v1");
  TestValidator.equals("upload-aware protocol", current.protocol, "automovie.render-target.v2");
  TestValidator.predicate("invalid upload digest refuses", throwsError(() => sealAutoMovieRenderTarget({ ...props, textureDigest: "sha256:wrong" }), "textureDigest"));
  const report = evaluateAutoMovieRenderBudget({ inventory: {
    version: 1, models: [], textures: [], instanceSets: [], owners: [], gaps: [],
    totals: { triangles: 0, vertices: 0, drawCalls: 0, materials: 0, textures: 0,
      textureBytes: 0, geometryBytes: 0, lights: 0, shadowMaps: 0, nodes: 0,
      instanceSets: 0, instanceSlots: 0, instanceChunks: 0, fluidCells: 0, fluidParticles: 0 },
  }, budget: null, target: current,
    mask: deriveAutoMovieSemanticMask({ scene: { ...sceneFixture(), nodes: [], lights: [] }, models: [] }),
  });
  TestValidator.equals("unchanged upload target", compareAutoMovieRenderTarget({ report, current }).fresh, true);
  TestValidator.equals("legacy cannot certify uploads", compareAutoMovieRenderTarget({ report, current: old }).drift.map((row) => row.field), ["protocol", "textureDigest"]);
  const changed = sealAutoMovieRenderTarget({ ...props, textureDigest: autoMovieRenderTextureDigest([a]) });
  TestValidator.equals("changed upload target", compareAutoMovieRenderTarget({ report, current: changed }).drift.map((row) => row.field), ["textureDigest"]);
};
