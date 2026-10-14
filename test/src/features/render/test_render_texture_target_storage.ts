import { autoMovieRenderTextureDigest, measureAutoMovieRenderTextureClosure, measureAutoMovieRenderTextureTarget, type IAutoMovieRenderTextureResidency, type IAutoMovieRenderTextureTarget } from "@automovie/engine";
import type { IAutoMovieMaterial, IAutoMovieRenderTextureCost } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { material } from "../internal/renderFixtures";
import { throwsError } from "../internal/predicates";

/**
 * Target storage includes resolved mips and every color/depth sample attachment,
 * independent of image Source sharing. A transmissive material needs its target.
 *
 * Scenarios:
 *
 * 1. A 4-by-4 RGBA8 target with four samples and depth costs resolved84 plus
 *    color256 plus depth320 bytes; half-float and multiple colors use their widths.
 * 2. Invalid samples, formats, extents, depth widths and overflow remain null.
 * 3. Required transmission without a target is unknown; a matching live profile
 *    supplies the independently computed bound and changes target freshness.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls target measurement, closure and fact hashing, asserting component/mip/sample/depth bytes, null refusals, transmission requirements, retained target rows and allocation counts; this catches attachment omission, unsafe sums admitted or material removal incorrectly dropping retained storage.
 * @evidence contracts/testing.md#independent-expectations A 4-by-4 RGBA8 chain costs 84 bytes, four color samples cost 256 and resolved plus four sampled depth planes cost 320. Explicit component widths, attachment populations and safe-integer arithmetic supply other expectations; changing or removing supplied target facts tests closure semantics and does not observe actual host disposal.
 * @evidence contracts/testing.md#distinguishing-cases Covers five color representations, multiple attachments, single faces, depth textures and no-depth/base-only neighbours; malformed samples, extents, depth and face counts; adjacent safe and overflowing totals; and missing, retained-unknown or removed transmission targets. Invalid owners refuse, opaque materials require no transmission, and changed width changes identity.
 * @evidence contracts/testing.md#execution-ownership The exported test_render_texture_target_storage entry owns synchronous arithmetic, closure and digest cases over explicit profile records, creating no framebuffer, native texture, renderer, process or installed consumer; target removal is supplied as input rather than performed on a graphics host.
 */
export function test_render_texture_target_storage(): void {
  const target: IAutoMovieRenderTextureTarget = { owner: "view", transmissionScope: "current",
    width: 4, height: 4, formats: ["rgba8"], mipmapped: true, samples: 4, depthBytesPerTexel: 4 };
  TestValidator.equals("complete RGBA8 target", measureAutoMovieRenderTextureTarget(target), 84 + 256 + 320);
  TestValidator.equals("half-float target", measureAutoMovieRenderTextureTarget({ ...target, formats: ["rgba16f"] }), 168 + 512 + 320);
  TestValidator.equals("float target", measureAutoMovieRenderTextureTarget({ ...target, formats: ["rgba32f"] }), 336 + 1024 + 320);
  TestValidator.equals("single-channel half target", measureAutoMovieRenderTextureTarget({ ...target, formats: ["r16f"] }), 42 + 128 + 320);
  TestValidator.equals("RG half target", measureAutoMovieRenderTextureTarget({ ...target, formats: ["rg16f"] }), 84 + 256 + 320);
  TestValidator.equals("explicit single face preserves 2D bound", measureAutoMovieRenderTextureTarget({ ...target, faces: 1 }), 660);
  TestValidator.equals("invalid native face population stays unknown", measureAutoMovieRenderTextureTarget(Object.assign({ ...target }, { faces: 0 })), null);
  TestValidator.equals("multiple color attachments", measureAutoMovieRenderTextureTarget({ ...target, formats: ["rgba8", "rgba16f"] }), 84 + 168 + 4 * (64 + 128) + 320);
  TestValidator.equals("no depth, samples or mips", measureAutoMovieRenderTextureTarget({ ...target, mipmapped: false, samples: 0, depthBytesPerTexel: 0 }), 64);
  const depthOverflow: IAutoMovieRenderTextureTarget = { ...target, width: 2 ** 25, height: 2 ** 25, samples: 0, mipmapped: false };
  TestValidator.equals("final depth sum overflow", measureAutoMovieRenderTextureTarget(depthOverflow), null);
  TestValidator.equals("adjacent safe no-depth total", measureAutoMovieRenderTextureTarget({ ...depthOverflow, depthBytesPerTexel: 0 }), 2 ** 52);
  TestValidator.equals("independent depth representation overflow", measureAutoMovieRenderTextureTarget({ ...target, samples: 0, depthBytesPerTexel: Number.MAX_SAFE_INTEGER }), null);
  for (const change of [{ samples: -1 }, { samples: 0.5 }, { formats: [] }, { formats: [undefined] },
    { depthBytesPerTexel: null }, { depthBytesPerTexel: -1 }, { depthBytesPerTexel: 0.5 }, { width: 0 },
    { height: NaN }, { width: 2 ** 25, height: 2 ** 25 }, { samples: Number.MAX_SAFE_INTEGER },
  ]) TestValidator.equals("unknown or unsafe target", measureAutoMovieRenderTextureTarget({ ...target, ...change }), null);
  const m: IAutoMovieMaterial = { ...material("glass"), transmission: 0.7 };
  const missing: IAutoMovieRenderTextureCost[] = measureAutoMovieRenderTextureClosure({ materials: [m], sources: [], environment: null });
  TestValidator.equals("transmission is not zero cost", missing.find((row: IAutoMovieRenderTextureCost): boolean => row.runtime === "transmission-target")!.bytes, null);
  const residency: IAutoMovieRenderTextureResidency = { owner: "current", residents: [], dfgRetained: false, pmremRetained: null, renderTargets: [target] };
  const known: IAutoMovieRenderTextureCost[] = measureAutoMovieRenderTextureClosure({ materials: [m], sources: [], environment: null, residency });
  TestValidator.equals("factual transmission target", known.find((row: IAutoMovieRenderTextureCost): boolean => row.runtime === "transmission-target")!.bytes, 660);
  TestValidator.equals("custom depth Texture increases allocation count", measureAutoMovieRenderTextureClosure({ materials: [m], sources: [], environment: null,
    residency: { ...residency, renderTargets: [{ ...target, depthTexture: true }] },
  }).find((row: IAutoMovieRenderTextureCost): boolean => row.runtime === "transmission-target")!.allocations, 2);
  const retainedUnknown: IAutoMovieRenderTextureResidency = { ...residency, renderTargets: [{ ...target, transmissionScope: undefined, formats: [undefined] }] };
  const removedMaterial: IAutoMovieRenderTextureCost[] = measureAutoMovieRenderTextureClosure({ materials: [], sources: [], environment: null, residency: retainedUnknown });
  TestValidator.equals("material removal does not dispose target", removedMaterial.find((row: IAutoMovieRenderTextureCost): boolean => row.runtime === "render-target")!.bytes, null);
  TestValidator.equals("reported target removal drops its closure", measureAutoMovieRenderTextureClosure({ materials: [], sources: [], environment: null, residency: { ...retainedUnknown, renderTargets: [] } }), []);
  for (const owner of ["", "view"])
    TestValidator.predicate("invalid target owner", throwsError((): IAutoMovieRenderTextureCost[] => measureAutoMovieRenderTextureClosure({ materials: [], sources: [], environment: null,
      residency: { ...residency, renderTargets: [target, { ...target, owner }] },
    }), "Render target owner"));
  TestValidator.equals("opaque material needs no transmission", measureAutoMovieRenderTextureClosure({ materials: [material("opaque")], sources: [], environment: null }).filter((row: IAutoMovieRenderTextureCost): boolean => row.runtime === "transmission-target"), []);
  TestValidator.predicate("target viewport affects freshness", autoMovieRenderTextureDigest([], residency) !== autoMovieRenderTextureDigest([], { ...residency, renderTargets: [{ ...target, width: 8 }] }));
}
