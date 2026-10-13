import { measureAutoMovieRenderTextureClosure } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { material } from "../internal/renderFixtures";

/**
 * Native generation allocates mip storage independently of filtering, while
 * explicit decoded levels remain resident. Invalid extents stay unknown.
 *
 * Scenarios:
 *
 * 1. Each authorable filter retains the exact 16+4+1 texel chain when generation
 *    is enabled and retains only16 base texels when generation is disabled.
 * 2. Existing levels remain counted under a nonmip filter, and legacy host
 *    facts retain their declared chain when generation was not reported.
 * 3. Invalid and overflowing environment derivatives have absent byte bounds.
 */
export const test_render_texture_mip_policy = (): void => {
  const sampler = { wrapS: "clamp" as const, wrapT: "clamp" as const, minFilter: "linear" as const, magFilter: "linear" as const };
  const m = { ...material("mat"), baseColorTexture: { asset: "image", texCoord: 0, colorSpace: "srgb" as const, sampler } };
  const source = { asset: "image", width: 4, height: 4, format: "rgba8" as const, mipmapped: true };
  const filters = ["nearest", "linear", "nearestMipmapLinear", "linearMipmapLinear"] as const;
  const bytes = (facts: typeof source & { generateMipmaps?: boolean; explicitMipmaps?: boolean }, minFilter: typeof filters[number] = "linear") =>
    measureAutoMovieRenderTextureClosure({ materials: [{ ...m, baseColorTexture: { ...m.baseColorTexture, sampler: { ...sampler, minFilter } } }], sources: [facts], environment: null }).find((row) => row.asset === "image")!.bytes;
  TestValidator.equals("legacy chain", bytes(source), 84);
  for (const filter of filters) {
    TestValidator.equals("native generation survives base-only sampling", bytes({ ...source, generateMipmaps: true }, filter), (16 + 4 + 1) * 4);
    TestValidator.equals("disabled generation retains only the base", bytes({ ...source, generateMipmaps: false }, filter), 16 * 4);
  }
  TestValidator.equals("explicit levels", bytes({ ...source, generateMipmaps: false, explicitMipmaps: true }), 84);
  TestValidator.equals("inherited filtering does not suppress native generation", measureAutoMovieRenderTextureClosure({ materials: [material("legacy", "image")], sources: [{ ...source, sampler, generateMipmaps: true }], environment: null }).find((row) => row.asset === "image")!.bytes, (16 + 4 + 1) * 4);
  for (const facts of [{ ...source, width: 0 }, { ...source, height: 0 }, { ...source, width: Number.MAX_SAFE_INTEGER }, { ...source, height: Number.MAX_SAFE_INTEGER }, { ...source, format: undefined }])
    TestValidator.predicate("unbounded environment", measureAutoMovieRenderTextureClosure({ materials: [m], sources: [facts], environment: "image" }).some((row) => row.asset === "image" && row.bytes === null));
};
