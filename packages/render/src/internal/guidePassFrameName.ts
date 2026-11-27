import type { AutoMovieGuidePass } from "@automovie/interface";

import { frameName } from "../frameName.js";
import { passExtension } from "../guidePassesInternal/internal/passExtension.js";

/**
 * File name of one frame of one pass: `beauty` keeps the plain `frameName`
 * spelling (`frame_00042.png`), and every other pass inserts its name before
 * the extension (`frame_00042.depth.png`).
 *
 * `index` is the zero-based frame number, zero-padded to `pad` digits, and
 * `ext` the extension without a dot. The untagged beauty name keeps a
 * single-pass render's paths unchanged, and the name depends only on the
 * arguments, so every machine writes the same paths and a chunk's frame
 * directory holds each pass's frames side by side.
 */
export const guidePassFrameName: (
  index: number,
  pass: AutoMovieGuidePass,
  ext?: string,
  pad?: number,
) => string = (
  index: number,
  pass: AutoMovieGuidePass,
  ext: string = "png",
  pad: number = 5,
): string => frameName(index, passExtension(pass, ext), pad);
