import type { AutoMovieGuidePass } from "@automovie/interface";

import { framePattern } from "../framePattern.js";
import { passExtension } from "../guidePassesInternal/passExtension.js";

/**
 * The ffmpeg `-i` input pattern matching every `guidePassFrameName` of one
 * pass, such as `frame_%05d.depth.png`.
 *
 * `ext` and `pad` must equal those the frames were named with.
 */
export const guidePassFramePattern: (
  pass: AutoMovieGuidePass,
  ext?: string,
  pad?: number,
) => string = (
  pass: AutoMovieGuidePass,
  ext: string = "png",
  pad: number = 5,
): string => framePattern(passExtension(pass, ext), pad);
