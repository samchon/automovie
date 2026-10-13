import { autoMovieRenderTextureDigest, measureAutoMovieRenderTextureClosure } from "@automovie/engine";
import { readAutoMovieTextureSource } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

import { material } from "../internal/renderFixtures";

/**
 * Supported native filters outside the authorable sampler union still split
 * actual Source allocations. Invalid inherited flags cannot certify storage,
 * while a complete authored sampler replaces them at the binding boundary.
 *
 * Scenarios:
 *
 * 1. Two actual clones using nearest/linear nearest-mip filters retain two
 *    independently calculated 84-byte chains; identical state shares one.
 * 2. Invalid inherited magnification remains unknown in image and runtime
 *    lanes, and a complete supported binding sampler retains generated storage.
 * 3. Unknown-state and native-filter changes invalidate the upload digest.
 */
export const test_render_texture_native_sampler = async (): Promise<void> => {
  const THREE = await import("three");
  const a = new THREE.DataTexture(new Uint8Array(64), 4, 4);
  a.generateMipmaps = true;
  a.minFilter = THREE.NearestMipmapNearestFilter;
  const b = a.clone();
  b.minFilter = THREE.LinearMipmapNearestFilter;
  const first = readAutoMovieTextureSource("a", a);
  const second = readAutoMovieTextureSource("b", b);
  TestValidator.equals("arranged shared pixels", first.sourceIdentity, second.sourceIdentity);
  TestValidator.predicate("arranged native filters split", first.samplerState !== second.samplerState);
  const close = (source = second) => measureAutoMovieRenderTextureClosure({
    materials: [material("first", "a"), material("second", "b")],
    sources: [first, source], environment: null,
  }).filter((row) => row.asset !== null);
  TestValidator.equals("native filter variants", close().map((row) => row.bytes), [84, 84]);
  TestValidator.equals("native filter sharing", close({ ...first, asset: "b" }).map((row) => row.bytes), [84]);
  Object.assign(b, { magFilter: 999 });
  const invalid = readAutoMovieTextureSource("b", b);
  TestValidator.equals("observed unsupported sampler", invalid.samplerState, null);
  TestValidator.equals("unsupported inherited upload stays unknown", close(invalid).find((row) => row.asset === "b")!.bytes, null);
  const replacement = { ...material("replacement"), baseColorTexture: { asset: "b", texCoord: 0,
    colorSpace: "srgb" as const, sampler: { wrapS: "clamp" as const, wrapT: "clamp" as const,
      minFilter: "nearest" as const, magFilter: "nearest" as const } } };
  TestValidator.equals("explicit sampler replaces invalid inheritance", measureAutoMovieRenderTextureClosure({
    materials: [replacement], sources: [invalid], environment: null,
  }).find((row) => row.asset === "b")!.bytes, (4 * 4 + 2 * 2 + 1) * 4);
  TestValidator.equals("disabled generation restores a base-only upload", measureAutoMovieRenderTextureClosure({
    materials: [replacement], sources: [{ ...invalid, generateMipmaps: false }], environment: null,
  }).find((row) => row.asset === "b")!.bytes, 4 * 4 * 4);
  const { asset: _asset, ...runtimeTexture } = invalid;
  TestValidator.equals("runtime sampler remains unknown", measureAutoMovieRenderTextureClosure({
    materials: [], sources: [], environment: null,
    residency: { owner: "current", residents: [], dfgRetained: false, pmremRetained: null,
      runtimeTextures: [{ owner: "runtime", texture: runtimeTexture }] },
  })[0].bytes, null);
  const digest = autoMovieRenderTextureDigest([second]);
  TestValidator.predicate("native filter changes freshness", autoMovieRenderTextureDigest([{ ...first, asset: "b" }]) !== digest);
  TestValidator.predicate("invalid sampler changes freshness", autoMovieRenderTextureDigest([invalid]) !== digest);
  for (const change of [{ wrapS: 999 }, { wrapT: 999 }, { minFilter: 999 }]) {
    const candidate = a.clone();
    Object.assign(candidate, change);
    TestValidator.equals("invalid native sampler flags remain unknown", readAutoMovieTextureSource("invalid", candidate).samplerState, null);
    candidate.dispose();
  }
  const fixed = [a.clone(), a.clone()];
  fixed[0].anisotropy = NaN;
  fixed[1].anisotropy = Infinity;
  const fixedFacts = fixed.map((texture, index) => readAutoMovieTextureSource(`fixed-${index}`, texture));
  TestValidator.predicate("nonfinite native keys remain distinct", fixedFacts[0].uploadState !== fixedFacts[1].uploadState);
  TestValidator.equals("fixed native variants retain two bounds", measureAutoMovieRenderTextureClosure({
    materials: fixedFacts.map((source, index) => material(`fixed-material-${index}`, source.asset)),
    sources: fixedFacts, environment: null,
  }).filter((row) => row.asset !== null).map((row) => row.bytes), [84, 84]);
  Object.assign(fixed[0], { wrapR: false, anisotropy: 1 });
  Object.assign(fixed[1], { wrapR: 0, anisotropy: 1 });
  TestValidator.equals("native falsy wrapR keys are equivalent", readAutoMovieTextureSource("same", fixed[0]).uploadState,
    readAutoMovieTextureSource("same", fixed[1]).uploadState);
  for (const texture of fixed) texture.dispose();
  a.dispose();
  b.dispose();
};
