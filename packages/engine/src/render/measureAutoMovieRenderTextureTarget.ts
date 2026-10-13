import type { IAutoMovieRenderTextureTarget } from "./IAutoMovieRenderTextureTarget";
import { measureAutoMovieTextureStorage } from "./measureAutoMovieTextureStorage";
import { autoMovieTextureFormatBytes } from "./autoMovieTextureFormatBytes";

/**
 * Bound resolved color mips and color/depth sample attachments across target faces.
 * Four-byte depth bounds D24 and D24S8 storage; a reported custom depth width
 * replaces that profile. Unknown attachments and unsafe sums remain null.
 * Driver allocation overhead and default-window framebuffer storage are outside
 * this target quantity. The requested sample count safely covers driver clamping.
 *
 * @evidence contracts/common.md#principled-implementation Sum resolved color mip storage plus base color times requested samples, add single/resampled depth and multiply by admitted 1/6 faces; unknown formats/depth, invalid quantities or unsafe integer totals return null.
 * @evidence contracts/common.md#clear-and-simple-design Attachment expansion is separate from per-texel format mapping and 2D mip storage, so source sharing cannot accidentally collapse independently allocated framebuffers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Requested samples conservatively cover driver clamping, and four-byte default/custom depth facts follow the reported profile; unknown values are not repaired into a plausible target size.
 * @evidence contracts/common.md#meaningful-documentation Docs give byte scope, resolved versus sample attachments, faces, null failure and exclusions of driver overhead/default-window framebuffer.
 * @evidence contracts/performance.md#efficient-algorithms A color attachments each run logarithmic mip extent arithmetic plus constant base/depth terms; no per-pixel allocation is made and auxiliary memory is constant.
 * @evidence contracts/performance.md#reuse-equivalent-work The shared storage/format owners are reused for color/depth terms; target values are cheap mutable facts and no persistent cache assumes stable attachment profiles.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a scalar/null escapes; no framebuffer, texture, native allocation or measurement task is retained.
 */
export function measureAutoMovieRenderTextureTarget(target: IAutoMovieRenderTextureTarget): number | null {
  if (!Number.isSafeInteger(target.samples) || target.samples < 0 || target.formats.length === 0 ||
      target.depthBytesPerTexel === null || !Number.isSafeInteger(target.depthBytesPerTexel) || target.depthBytesPerTexel < 0 ||
      (target.faces !== undefined && target.faces !== 1 && target.faces !== 6)) return null;
  let total: number = 0;
  for (const format of target.formats) {
    const bytesPerTexel: number | null = autoMovieTextureFormatBytes(format);
    const resolved: number | null = measureAutoMovieTextureStorage({ ...target, bytesPerTexel });
    const base: number | null = measureAutoMovieTextureStorage({ ...target, bytesPerTexel, mipmapped: false });
    if (resolved === null || base === null) return null;
    total += resolved + base * target.samples;
    if (!Number.isSafeInteger(total)) return null;
  }
  if (target.depthBytesPerTexel !== 0) {
    const depth: number | null = measureAutoMovieTextureStorage({ ...target, bytesPerTexel: target.depthBytesPerTexel, mipmapped: false });
    if (depth === null) return null;
    total += depth * (1 + target.samples);
  }
  total *= target.faces ?? 1;
  return Number.isSafeInteger(total) ? total : null;
}
