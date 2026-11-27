import type { IAutoMovieRenderTextureTarget } from "@automovie/interface";

import { autoMovieTextureFormatBytes } from "./autoMovieTextureFormatBytes";
import { measureAutoMovieTextureStorage } from "./measureAutoMovieTextureStorage";

/*
 * Bound resolved color mips and color/depth sample attachments across target
 * faces. Four-byte depth bounds D24 and D24S8 storage; a reported custom depth
 * width replaces that profile. Unknown attachments and unsafe sums remain null.
 * Driver allocation overhead and default-window framebuffer storage are outside
 * this target quantity. The requested sample count safely covers driver
 * clamping.
 */
export function measureAutoMovieRenderTextureTarget(
  target: IAutoMovieRenderTextureTarget,
): number | null {
  if (
    target.samples < 0 ||
    target.formats.length === 0 ||
    target.depthBytesPerTexel === null ||
    target.depthBytesPerTexel < 0 ||
    (target.faces !== undefined && target.faces !== 1 && target.faces !== 6)
  )
    return null;
  let total: number = 0;
  for (const format of target.formats) {
    const bytesPerTexel: number | null = autoMovieTextureFormatBytes(format);
    const resolved: number | null = measureAutoMovieTextureStorage({
      ...target,
      bytesPerTexel,
    });
    const base: number | null = measureAutoMovieTextureStorage({
      ...target,
      bytesPerTexel,
      mipmapped: false,
    });
    if (resolved === null || base === null) return null;
    total += resolved + base * target.samples;
    if (total > Number.MAX_SAFE_INTEGER) return null;
  }
  if (target.depthBytesPerTexel !== 0) {
    const depth: number | null = measureAutoMovieTextureStorage({
      ...target,
      bytesPerTexel: target.depthBytesPerTexel,
      mipmapped: false,
    });
    if (depth === null) return null;
    total += depth * (1 + target.samples);
  }
  total *= target.faces ?? 1;
  return total > Number.MAX_SAFE_INTEGER ? null : total;
}
