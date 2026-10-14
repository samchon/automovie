import { autoMovieRenderTextureDigest, measureAutoMovieRenderTextureClosure } from "@automovie/engine";
import { readAutoMovieTextureSource } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import type { DataTexture } from "three";
import type { IAutoMovieRenderTextureSource } from "@automovie/engine";
import type { IAutoMovieMaterial } from "@automovie/interface";

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
 *
 * @evidence contracts/testing.md#behavioral-verification Observes actual CPU texture/clone metadata, measures native filter sharing and unsupported inheritance through the real closure, and checks upload digest changes and native key distinctions.
 * @evidence contracts/testing.md#independent-expectations Each 4-by-4 RGBA8 generated chain costs (16+4+1)*4 = 84 bytes, while disabled generation costs 64; expected null sampler state and equality/distinction relations come from authored native flags.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts two supported non-authorable native filters with matching state, invalid inherited magnification versus complete binding replacement, invalid wrap/minification fields, NaN/Infinity keys and equivalent falsy wrapR keys.
 * @evidence contracts/testing.md#execution-ownership Owns CPU Three DataTextures and clones, loads the module asynchronously and disposes every created texture on the successful path; the portable runner observes metadata only, without WebGL upload, native retirement or failure-cleanup verification.
 */
export async function test_render_texture_native_sampler(): Promise<void> {
  const THREE: typeof import("three") = await import("three");
  const a: DataTexture = new THREE.DataTexture(new Uint8Array(64), 4, 4);
  a.generateMipmaps = true;
  a.minFilter = THREE.NearestMipmapNearestFilter;
  const b: DataTexture = a.clone();
  b.minFilter = THREE.LinearMipmapNearestFilter;
  const first: IAutoMovieRenderTextureSource = readAutoMovieTextureSource("a", a);
  const second: IAutoMovieRenderTextureSource = readAutoMovieTextureSource("b", b);
  TestValidator.equals("arranged shared pixels", first.sourceIdentity, second.sourceIdentity);
  TestValidator.predicate("arranged native filters split", first.samplerState !== second.samplerState);
  const close: (source?: IAutoMovieRenderTextureSource) => ReturnType<typeof measureAutoMovieRenderTextureClosure> = (source: IAutoMovieRenderTextureSource = second): ReturnType<typeof measureAutoMovieRenderTextureClosure> => measureAutoMovieRenderTextureClosure({
    materials: [material("first", "a"), material("second", "b")],
    sources: [first, source], environment: null,
  }).filter((row: ReturnType<typeof measureAutoMovieRenderTextureClosure>[number]): boolean => row.asset !== null);
  TestValidator.equals("native filter variants", close().map((row: ReturnType<typeof close>[number]): number | null => row.bytes), [84, 84]);
  TestValidator.equals("native filter sharing", close({ ...first, asset: "b" }).map((row: ReturnType<typeof close>[number]): number | null => row.bytes), [84]);
  Object.assign(b, { magFilter: 999 });
  const invalid: IAutoMovieRenderTextureSource = readAutoMovieTextureSource("b", b);
  TestValidator.equals("observed unsupported sampler", invalid.samplerState, null);
  TestValidator.equals("unsupported inherited upload stays unknown", close(invalid).find((row: ReturnType<typeof close>[number]): boolean => row.asset === "b")!.bytes, null);
  const replacement: IAutoMovieMaterial = { ...material("replacement"), baseColorTexture: { asset: "b", texCoord: 0,
    colorSpace: "srgb" as const, sampler: { wrapS: "clamp" as const, wrapT: "clamp" as const,
      minFilter: "nearest" as const, magFilter: "nearest" as const } } };
  TestValidator.equals("explicit sampler replaces invalid inheritance", measureAutoMovieRenderTextureClosure({
    materials: [replacement], sources: [invalid], environment: null,
  }).find((row: ReturnType<typeof close>[number]): boolean => row.asset === "b")!.bytes, (4 * 4 + 2 * 2 + 1) * 4);
  TestValidator.equals("disabled generation restores a base-only upload", measureAutoMovieRenderTextureClosure({
    materials: [replacement], sources: [{ ...invalid, generateMipmaps: false }], environment: null,
  }).find((row: ReturnType<typeof close>[number]): boolean => row.asset === "b")!.bytes, 4 * 4 * 4);
  const { asset: _asset, ...runtimeTexture }: IAutoMovieRenderTextureSource = invalid;
  TestValidator.equals("runtime sampler remains unknown", measureAutoMovieRenderTextureClosure({
    materials: [], sources: [], environment: null,
    residency: { owner: "current", residents: [], dfgRetained: false, pmremRetained: null,
      runtimeTextures: [{ owner: "runtime", texture: runtimeTexture }] },
  })[0].bytes, null);
  const digest: string = autoMovieRenderTextureDigest([second]);
  TestValidator.predicate("native filter changes freshness", autoMovieRenderTextureDigest([{ ...first, asset: "b" }]) !== digest);
  TestValidator.predicate("invalid sampler changes freshness", autoMovieRenderTextureDigest([invalid]) !== digest);
  for (const change of [{ wrapS: 999 }, { wrapT: 999 }, { minFilter: 999 }]) {
    const candidate: DataTexture = a.clone();
    Object.assign(candidate, change);
    TestValidator.equals("invalid native sampler flags remain unknown", readAutoMovieTextureSource("invalid", candidate).samplerState, null);
    candidate.dispose();
  }
  const fixed: [DataTexture, DataTexture] = [a.clone(), a.clone()];
  fixed[0].anisotropy = NaN;
  fixed[1].anisotropy = Infinity;
  const fixedFacts: IAutoMovieRenderTextureSource[] = fixed.map((texture: DataTexture, index: number): IAutoMovieRenderTextureSource => readAutoMovieTextureSource(`fixed-${index}`, texture));
  TestValidator.predicate("nonfinite native keys remain distinct", fixedFacts[0].uploadState !== fixedFacts[1].uploadState);
  TestValidator.equals("fixed native variants retain two bounds", measureAutoMovieRenderTextureClosure({
    materials: fixedFacts.map((source: IAutoMovieRenderTextureSource, index: number): ReturnType<typeof material> => material(`fixed-material-${index}`, source.asset)),
    sources: fixedFacts, environment: null,
  }).filter((row: ReturnType<typeof close>[number]): boolean => row.asset !== null).map((row: ReturnType<typeof close>[number]): number | null => row.bytes), [84, 84]);
  Object.assign(fixed[0], { wrapR: false, anisotropy: 1 });
  Object.assign(fixed[1], { wrapR: 0, anisotropy: 1 });
  TestValidator.equals("native falsy wrapR keys are equivalent", readAutoMovieTextureSource("same", fixed[0]).uploadState,
    readAutoMovieTextureSource("same", fixed[1]).uploadState);
  for (const texture of fixed) texture.dispose();
  a.dispose();
  b.dispose();
}
