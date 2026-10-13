import type { AutoMovieTextureBinding, IAutoMovieTextureReference } from "@automovie/interface";

/**
 * Identify binding-controlled GPU upload state independently of shader UVs.
 * A source's inherited sampler is shared by all clones that omit a sampler;
 * when its host reports that sampler, an equivalent explicit binding shares
 * the same key. UV channel, offset, scale and rotation do not allocate storage.
 * The source owner adds actual format, type and upload state to this key.
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
