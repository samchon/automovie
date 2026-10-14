import type { IAutoMovieRenderTextureSource } from "./IAutoMovieRenderTextureSource";

/**
 * One component-layout owner for source uploads and framebuffer attachments.
 * RG half-float has two two-byte components; RGBA byte/half/float has four
 * one/two/four-byte components. Unreported layout keeps storage unknown.
 *
 * @evidence contracts/common.md#principled-implementation Map supported component layouts to their exact uncompressed bytes per texel: R16F=2, RG16F/RGBA8=4, RGBA16F=8 and RGBA32F=16; absent format returns null.
 * @evidence contracts/common.md#clear-and-simple-design One layout owner serves decoded source uploads and framebuffer attachments, while mip/face/sample expansion belongs to storage measurement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown layout stays unknown instead of guessing HDR bytes from image dimensions; the mapping uses actual supported component widths rather than a fixture multiplier.
 * @evidence contracts/common.md#meaningful-documentation Docs identify bytes per texel and null for unreported format; driver overhead and encoded source bytes are outside this scalar.
 * @evidence contracts/performance.md#efficient-algorithms A fixed-size discriminant chain performs O(1) work and returns one number or null with no allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work Source and target measurements reuse this canonical layout mapping; immutable enum values require no retained memoization.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No decoded pixels, texture object, handle or asynchronous work is retained.
 */
export function autoMovieTextureFormatBytes(
  format: IAutoMovieRenderTextureSource["format"],
): number | null {
  return format === "r16f"
    ? 2
    : format === "rgba8" || format === "rg16f"
      ? 4
      : format === "rgba16f"
        ? 8
        : format === "rgba32f"
          ? 16
          : null;
}
