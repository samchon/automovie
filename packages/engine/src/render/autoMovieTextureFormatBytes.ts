import type { IAutoMovieRenderTextureSource } from "./IAutoMovieRenderTextureSource";

/**
 * One component-layout owner for source uploads and framebuffer attachments.
 * RG half-float has two two-byte components; RGBA byte/half/float has four
 * one/two/four-byte components. Unreported layout keeps storage unknown.
 *
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Converts supported actual upload layouts into uncompressed texel width for both image and framebuffer storage.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Keeps unsupported representations unbounded through one shared component-width owner.
 */
export function autoMovieTextureFormatBytes(format: IAutoMovieRenderTextureSource["format"]): number | null {
  return format === "r16f" ? 2 : format === "rgba8" || format === "rg16f" ? 4 :
    format === "rgba16f" ? 8 : format === "rgba32f" ? 16 : null;
}
