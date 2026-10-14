import type { AutoMovieGuidePass } from "@automovie/interface";
import { framePattern } from "./framePattern";
import { passExtension } from "./guidePassesInternal/passExtension";


/**
 * The ffmpeg `-i` input pattern matching every `guidePassFrameName` of one pass, such as `frame_%05d.depth.png`.
 *
 * `ext` and `pad` must equal those the frames were named with.
 *
 * @evidence contracts/common.md#principled-implementation The pattern is `framePattern` over the same pass-tagged extension `guidePassFrameName` uses, so ffmpeg's `%0Nd` sequence syntax matches exactly that pass's files.
 * @evidence contracts/common.md#clear-and-simple-design It shares `passExtension` with `guidePassFrameName`, so a name and its pattern cannot disagree on the pass tag.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No pass or extension is special-cased beyond the untagged beauty rule shared with the frame names.
 * @evidence contracts/common.md#meaningful-documentation The doc says which names the pattern matches, gives an example, and states that the arguments must match the naming call.
 * @evidence contracts/performance.md#efficient-algorithms Constructing the numbered input pattern costs linear time in the chosen extension and resulting string length, with no frame traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call formats one short pattern, so caching would cost more than formatting.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The pattern string goes straight into an ffmpeg argument list owned by the caller; this function starts no ffmpeg process and keeps no reference.
 * @author Samchon
 */
export const guidePassFramePattern: (pass: AutoMovieGuidePass, ext?: string, pad?: number) => string = (
  pass: AutoMovieGuidePass,
  ext: string = "png",
  pad: number = 5,
): string => framePattern(passExtension(pass, ext), pad);
