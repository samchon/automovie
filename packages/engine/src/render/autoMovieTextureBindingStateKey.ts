import type { AutoMovieTextureBinding, IAutoMovieTextureReference } from "@automovie/interface";

/**
 * Identify binding-controlled GPU upload state independently of shader UVs.
 * A source's inherited sampler is shared by all clones that omit a sampler;
 * when its host reports that sampler, an equivalent explicit binding shares
 * the same key. UV channel, offset, scale and rotation do not allocate storage.
 * The source owner adds actual format, type and upload state to this key.
 *
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Separates material sampler and color decoding variants from shared decoded source pixels.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Identifies resident binding variants without charging shader-side UV transforms as new uploads.
 */
export function autoMovieTextureBindingStateKey(
  binding: AutoMovieTextureBinding,
  legacyColorSpace: "srgb" | "linear" | "linear-environment",
  sourceSampler?: IAutoMovieTextureReference["sampler"],
  sourceSamplerState?: string | null,
): string {
  const reference = typeof binding === "string" ? undefined : binding;
  const sampler = reference?.sampler ?? sourceSampler;
  return JSON.stringify([
    reference?.colorSpace ?? legacyColorSpace,
    sampler === undefined ? sourceSamplerState ?? "source-sampler" : [
      sampler.wrapS, sampler.wrapT, sampler.minFilter, sampler.magFilter,
    ],
  ]);
}
