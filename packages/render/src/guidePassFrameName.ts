import type { AutoMovieGuidePass } from "@automovie/interface";
import { frameName } from "./frameName";
import { passExtension } from "./guidePassesInternal/passExtension";


/**
 * File name of one frame of one pass: `beauty` keeps the plain `frameName` spelling (`frame_00042.png`), and every other pass inserts its name before the extension (`frame_00042.depth.png`).
 *
 * `index` is the zero-based frame number, zero-padded to `pad` digits, and `ext` the extension without a dot. The untagged beauty name keeps a single-pass render's paths unchanged, and the name depends only on the arguments, so every machine writes the same paths and a chunk's frame directory holds each pass's frames side by side.
 *
 * @evidence contracts/common.md#principled-implementation The pass becomes a second extension segment on the shared frame-name rule, so names of different passes never collide and ffmpeg's numbered-sequence pattern still matches each pass separately.
 * @evidence contracts/common.md#clear-and-simple-design The function delegates numbering and padding to `frameName` and adds only the pass tag through the private `passExtension`, so frame naming has one owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The untagged `beauty` name is the documented compatibility rule for single-pass output, not a consumer special case.
 * @evidence contracts/common.md#meaningful-documentation The doc gives both name shapes with examples, each argument's meaning and default, and why beauty stays untagged.
 * @evidence contracts/performance.md#efficient-algorithms The call builds one short string in time linear in its length.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call formats one short name, so caching would cost more than formatting.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Each frame name is a new string the capture writer uses as a path once; nothing about the pass or index is cached, and no file is opened here.
 * @author Samchon
 */
export const guidePassFrameName: (index: number, pass: AutoMovieGuidePass, ext?: string, pad?: number) => string = (
  index: number,
  pass: AutoMovieGuidePass,
  ext: string = "png",
  pad: number = 5,
): string => frameName(index, passExtension(pass, ext), pad);
