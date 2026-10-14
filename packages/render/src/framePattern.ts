/**
 * The ffmpeg image-sequence input pattern, such as `frame_%05d.png`, that
 * matches every `frameName` written with the same `ext` and `pad`.
 *
 * ffmpeg expands `%0<pad>d` to each frame number from 0 upward, so the
 * pattern names the sequence without a shell glob.
 *
 * @evidence contracts/common.md#principled-implementation ffmpeg's image2 demuxer reads `%0Nd` as a zero-padded decimal frame number, the same text `frameName` writes, so the two cannot disagree when called with equal arguments.
 * @evidence contracts/common.md#clear-and-simple-design The single render, the sequence and chunk plans and `guidePassFramePattern` build their encoder input through this one function, beside `frameName`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The caller's extension and pad are interpolated as given, with no extension or width special-cased.
 * @evidence contracts/common.md#meaningful-documentation The doc gives an example, the naming call it matches, and how ffmpeg reads it.
 * @evidenceExclude contracts/performance.md#efficient-algorithms One template interpolation of the pad and extension chooses no algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pattern is formatted once per encode, cheaper than caching it.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The pattern string goes to the caller's argument list and nothing is kept or opened.
 * @author Samchon
 */
export const framePattern: (ext?: string, pad?: number) => string = (
  ext: string = "png",
  pad: number = 5,
): string => `frame_%0${pad}d.${ext}`;
