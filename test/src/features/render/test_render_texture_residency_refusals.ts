import { autoMovieRenderTextureDigest, measureAutoMovieRenderTextureClosure, type IAutoMovieRenderTextureResidency, type IAutoMovieRenderTextureSource } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";
import { material } from "../internal/renderFixtures";

/**
 * A context-level bound requires unambiguous live owners and actual sharing
 * facts. Runtime copies and retained scratch keep unknown storage explicit.
 *
 * Scenarios:
 *
 * 1. Missing source/upload/environment clone identity remains unbounded beside
 *    the supported identity-complete twin; contradictory scoped facts refuse.
 * 2. Duplicate or blank resident/compositor owners refuse instead of overwriting
 *    a live resource, and environment facts must name the declared asset.
 * 3. Two display compositors retain six nonmip RGBA8 copies; invalid extents and
 *    an invalid retained PMREM target remain null, not zero storage.
 * 4. Inherited upload flags split a shared source; their target identity and
 *    retained runtime extents change deterministically.
 */
export const test_render_texture_residency_refusals = (): void => {
  const m = material("m", "image");
  const a: IAutoMovieRenderTextureSource = { asset: "image", width: 4, height: 4, mipmapped: false,
    format: "rgba8", environmentBackgroundFormat: "rgba8", sourceIdentity: "source", textureIdentity: "texture", uploadState: "rgba8-flags",
    environmentSamplerState: "inherited-fixture-sampling" };
  const profile = (source = a): IAutoMovieRenderTextureResidency => ({ owner: "a", dfgRetained: false, pmremRetained: null,
    residents: [{ owner: "b", materials: [m], sources: [source], environment: null, shadowCasters: [], areaLights: false }],
  });
  const close = (residency = profile(), sources = [a], environment: string | null = null) =>
    measureAutoMovieRenderTextureClosure({ materials: [m], sources, environment, residency });
  TestValidator.predicate("identity-complete twin", close().every((row) => row.bytes !== null));
  TestValidator.equals("same descriptor is idempotent", close(profile(), [a, a]).map((row) => row.bytes), close().map((row) => row.bytes));
  for (const source of [{ ...a, sourceIdentity: undefined }, { ...a, uploadState: undefined }])
    TestValidator.predicate("unknown sharing is not a complete bound", close(profile(source)).some((row) => row.bytes === null));
  TestValidator.predicate("missing environment clone identity", close({ ...profile(), residents: [{ ...profile().residents[0], environment: "image" }] }).some((row) => row.bytes === null));
  for (const owner of ["", "a"])
    TestValidator.predicate("invalid resident owner", throwsError(() => close({ ...profile(), residents: [{ ...profile().residents[0], owner }] }), "owner"));
  TestValidator.predicate("duplicate scoped source", throwsError(() => close(profile(), [a, { ...a }]), "repeats source"));
  TestValidator.predicate("same source contradictory extent", throwsError(() => close(profile({ ...a, width: 8 })), "contradictory resident"));
  TestValidator.predicate("wrong environment facts", throwsError(() => close({ ...profile(), environmentTexture: { ...a, asset: "wrong" } }, [a], "image"), "different asset"));
  const envProfile = { ...profile(), environmentTexture: a,
    residents: [{ ...profile().residents[0], environment: "image", environmentTexture: { ...a, sourceIdentity: "other", height: 8 } }],
  };
  TestValidator.predicate("same environment contradictory cube", throwsError(() => close(envProfile, [a], "image"), "contradictory background"));
  TestValidator.predicate("same environment contradictory atlas", throwsError(() => close({ ...envProfile,
    residents: [{ ...envProfile.residents[0], environmentTexture: { ...a, sourceIdentity: "other", width: 512 } }],
  }, [a], "image"), "contradictory PMREM"));
  TestValidator.equals("upload flags split a shared source", close(profile({ ...a, uploadState: "flipped-rgba8" })).filter((row) => row.asset !== null).map((row) => row.bytes), [64, 64]);
  const runtime: IAutoMovieRenderTextureResidency = { owner: "a", residents: [], dfgRetained: false, pmremRetained: null,
    displayCompositors: [{ owner: "fade", width: 4, height: 4 }, { owner: "dissolve", width: 8, height: 4 }],
  };
  const copies = measureAutoMovieRenderTextureClosure({ materials: [], sources: [], environment: null, residency: runtime });
  TestValidator.equals("two actual compositors own six copies", copies.length, 6);
  TestValidator.equals("display copy storage", copies.reduce((sum, row) => sum + row.bytes!, 0), 3 * (4 * 4 * 4 + 8 * 4 * 4));
  for (const owner of ["", "fade"])
    TestValidator.predicate("invalid compositor owner", throwsError(() => close({ ...runtime, displayCompositors: [...runtime.displayCompositors!, { owner, width: 4, height: 4 }] }), "compositor owner"));
  const unknown = measureAutoMovieRenderTextureClosure({ materials: [], sources: [], environment: null,
    residency: { ...runtime, dfgRetained: true, pmremRetained: { width: 0, height: 4 },
      displayCompositors: [{ owner: "fade", width: Infinity, height: 4 }] },
  });
  TestValidator.equals("retained lookup survives an empty scene", unknown.find((row) => row.runtime === "dfg-lut")!.bytes, 1024);
  TestValidator.predicate("unknown retained storage", unknown.filter((row) => row.runtime !== "dfg-lut").every((row) => row.bytes === null));
  const digest = autoMovieRenderTextureDigest([a], runtime);
  TestValidator.predicate("retained DFG changes identity", autoMovieRenderTextureDigest([a], { ...runtime, dfgRetained: true }) !== digest);
  TestValidator.predicate("retained scratch changes identity", autoMovieRenderTextureDigest([a], { ...runtime, pmremRetained: { width: 336, height: 4 } }) !== digest);
  TestValidator.equals("compositor ordering is immaterial", autoMovieRenderTextureDigest([a], { ...runtime, displayCompositors: [...runtime.displayCompositors!].reverse() }), digest);
  TestValidator.predicate("compositor extent changes identity", autoMovieRenderTextureDigest([a], { ...runtime, displayCompositors: [{ owner: "fade", width: 2, height: 4 }] }) !== digest);
};
