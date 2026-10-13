import type { IAutoMovieRenderTextureSource } from "./IAutoMovieRenderTextureSource";

/**
 * One component-layout owner for source uploads and framebuffer attachments.
 * RG half-float has two two-byte components; RGBA byte/half/float has four
 * one/two/four-byte components. Unreported layout keeps storage unknown.
 */
export function autoMovieTextureFormatBytes(format: IAutoMovieRenderTextureSource["format"]): number | null {
  return format === "r16f" ? 2 : format === "rgba8" || format === "rg16f" ? 4 :
    format === "rgba16f" ? 8 : format === "rgba32f" ? 16 : null;
}
