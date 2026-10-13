import { autoMovieRenderTextureDigest, measureAutoMovieRenderTextureClosure, measureAutoMovieRenderTextureTarget, type IAutoMovieRenderTextureTarget } from "@automovie/engine";
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
 */
export const test_render_texture_target_storage = (): void => {
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
  const depthOverflow = { ...target, width: 2 ** 25, height: 2 ** 25, samples: 0, mipmapped: false };
  TestValidator.equals("final depth sum overflow", measureAutoMovieRenderTextureTarget(depthOverflow), null);
  TestValidator.equals("adjacent safe no-depth total", measureAutoMovieRenderTextureTarget({ ...depthOverflow, depthBytesPerTexel: 0 }), 2 ** 52);
  TestValidator.equals("independent depth representation overflow", measureAutoMovieRenderTextureTarget({ ...target, samples: 0, depthBytesPerTexel: Number.MAX_SAFE_INTEGER }), null);
  for (const change of [{ samples: -1 }, { samples: 0.5 }, { formats: [] }, { formats: [undefined] },
    { depthBytesPerTexel: null }, { depthBytesPerTexel: -1 }, { depthBytesPerTexel: 0.5 }, { width: 0 },
    { height: NaN }, { width: 2 ** 25, height: 2 ** 25 }, { samples: Number.MAX_SAFE_INTEGER },
  ]) TestValidator.equals("unknown or unsafe target", measureAutoMovieRenderTextureTarget({ ...target, ...change }), null);
  const m = { ...material("glass"), transmission: 0.7 };
  const missing = measureAutoMovieRenderTextureClosure({ materials: [m], sources: [], environment: null });
  TestValidator.equals("transmission is not zero cost", missing.find((row) => row.runtime === "transmission-target")!.bytes, null);
  const residency = { owner: "current", residents: [], dfgRetained: false, pmremRetained: null, renderTargets: [target] };
  const known = measureAutoMovieRenderTextureClosure({ materials: [m], sources: [], environment: null, residency });
  TestValidator.equals("factual transmission target", known.find((row) => row.runtime === "transmission-target")!.bytes, 660);
  TestValidator.equals("custom depth Texture increases allocation count", measureAutoMovieRenderTextureClosure({ materials: [m], sources: [], environment: null,
    residency: { ...residency, renderTargets: [{ ...target, depthTexture: true }] },
  }).find((row) => row.runtime === "transmission-target")!.allocations, 2);
  const retainedUnknown = { ...residency, renderTargets: [{ ...target, transmissionScope: undefined, formats: [undefined] }] };
  const removedMaterial = measureAutoMovieRenderTextureClosure({ materials: [], sources: [], environment: null, residency: retainedUnknown });
  TestValidator.equals("material removal does not dispose target", removedMaterial.find((row) => row.runtime === "render-target")!.bytes, null);
  TestValidator.equals("actual host disposal removes target", measureAutoMovieRenderTextureClosure({ materials: [], sources: [], environment: null, residency: { ...retainedUnknown, renderTargets: [] } }), []);
  for (const owner of ["", "view"])
    TestValidator.predicate("invalid target owner", throwsError(() => measureAutoMovieRenderTextureClosure({ materials: [], sources: [], environment: null,
      residency: { ...residency, renderTargets: [target, { ...target, owner }] },
    }), "Render target owner"));
  TestValidator.equals("opaque material needs no transmission", measureAutoMovieRenderTextureClosure({ materials: [material("opaque")], sources: [], environment: null }).filter((row) => row.runtime === "transmission-target"), []);
  TestValidator.predicate("target viewport affects freshness", autoMovieRenderTextureDigest([], residency) !== autoMovieRenderTextureDigest([], { ...residency, renderTargets: [{ ...target, width: 8 }] }));
};
