import { autoMovieRenderTextureDigest, measureAutoMovieRenderTextureClosure, type IAutoMovieRenderTextureResidency } from "@automovie/engine";
import { readAutoMovieTextureSource } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";
import { material } from "../internal/renderFixtures";

/**
 * Renderer data tables are actual texture allocations, independent of authored
 * asset files. Their retained source/state sharing uses the same physical rule.
 *
 * Scenarios:
 *
 * 1. A 64-by-6 RGBA32F nonmip cycle table costs 64*6*16 bytes; aliases of the
 *    same Source/state share it, while a different color-space key splits it.
 * 2. The same table serving an authored linear map shares one raw allocation
 *    and keeps both asset and generating runtime attribution.
 * 3. Missing identity/decoding, duplicate owners and conflicting extents refuse
 *    a complete bound; runtime token renaming preserves target identity.
 */
export const test_render_runtime_texture_storage = async (): Promise<void> => {
  const THREE = await import("three");
  const table = new THREE.DataTexture(new Float32Array(64 * 6 * 4), 64, 6, THREE.RGBAFormat, THREE.FloatType);
  const { asset: _asset, ...texture } = readAutoMovieTextureSource("table", table);
  const profile = (runtimeTextures: NonNullable<IAutoMovieRenderTextureResidency["runtimeTextures"]>): IAutoMovieRenderTextureResidency => ({
    owner: "shot", residents: [], dfgRetained: false, pmremRetained: null, runtimeTextures,
  });
  const first = { owner: "formation:a/gait:walk", texture };
  const second = { owner: "formation:a/gait:run", texture: { ...texture } };
  const close = (runtimeTextures = [first, second]) => measureAutoMovieRenderTextureClosure({ materials: [], sources: [], environment: null, residency: profile(runtimeTextures) });
  TestValidator.equals("shared actual table storage", close().map((row) => [row.bytes, row.runtimeOwners]), [[64 * 6 * 16, [second.owner, first.owner]]]);
  TestValidator.equals("native decoding keys split", close([first, { ...second, texture: { ...texture, colorSpace: "linear-environment" } }]).map((row) => row.bytes), [64 * 6 * 16, 64 * 6 * 16]);
  const binding = { ...material("m"), normalTexture: "table" };
  const shared = measureAutoMovieRenderTextureClosure({ materials: [binding], sources: [{ ...texture, asset: "table" }], environment: null, residency: profile([first]) });
  const row = shared.find((cost) => cost.asset === "table")!;
  TestValidator.equals("runtime table shares a material upload", [row.bytes, row.materials, row.runtimeOwners], [64 * 6 * 16, ["m"], [first.owner]]);
  for (const missing of [{ sourceIdentity: undefined }, { colorSpace: undefined }, { uploadState: undefined }, { format: undefined }])
    TestValidator.equals("unknown runtime representation", close([{ ...first, texture: { ...texture, ...missing } }])[0].bytes, null);
  for (const owner of ["", first.owner])
    TestValidator.predicate("runtime owner refusal", throwsError(() => close([first, { ...second, owner }]), "Runtime texture owner"));
  TestValidator.predicate("conflicting shared runtime extent", throwsError(() => close([first, { ...second, texture: { ...texture, width: 32 } }]), "contradictory resident"));
  const digest = autoMovieRenderTextureDigest([], profile([first, second]));
  TestValidator.equals("runtime object token spelling is irrelevant", autoMovieRenderTextureDigest([], profile([first, second].map((item) => ({ ...item, texture: { ...item.texture, sourceIdentity: "renamed", textureIdentity: "also-renamed" } })))), digest);
  TestValidator.predicate("runtime decode affects target", autoMovieRenderTextureDigest([], profile([{ ...first, texture: { ...texture, colorSpace: "srgb" } }, second])) !== digest);
  TestValidator.predicate("runtime source split affects target", autoMovieRenderTextureDigest([], profile([first, { ...second, texture: { ...texture, sourceIdentity: "new-source" } }])) !== digest);
  TestValidator.predicate("runtime digest owner refusal", throwsError(() => autoMovieRenderTextureDigest([], profile([first, first])), "Runtime texture owner"));
  table.dispose();
};
