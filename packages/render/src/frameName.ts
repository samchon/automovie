/**
 * The file name of output frame `index` in an ffmpeg image sequence, such as
 * `frame_00042.png`.
 *
 * The index is zero-padded to `pad` digits and grows wider past
 * `10^pad - 1`, exactly as `framePattern`'s `%0<pad>d` prints it, so ffmpeg
 * reads every name this function writes. `index` must be a non-negative
 * safe integer and `ext` an extension without the dot; these premises are not checked here. The guide passes add their
 * pass tag to `ext`.
 *
 * @evidence contracts/common.md#principled-implementation For a non-negative safe-integer index, String produces ordinary decimal digits and padStart applies the requested minimum width, matching the numbered-sequence spelling. Negative, fractional or excessively large indices are unchecked misuse; JavaScript can use exponential notation for large numbers, which would not match ffmpeg's integer pattern.
 * @evidence contracts/common.md#clear-and-simple-design The beauty frames use the defaults and `guidePassFrameName` passes its tagged extension and pad, so every capture names its files through this one function.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No index, extension or pad is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The doc gives an example, the padding rule past the pad width, the match with `framePattern`, and the domain of `index` and `ext`.
 * @evidenceExclude contracts/performance.md#efficient-algorithms One `padStart` over the decimal index chooses no algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call names a different frame, and formatting is cheaper than a lookup.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Each name is returned to the capture or encoder plan that uses it, and the function keeps no reference.
 * @author Samchon
 */
export const frameName: (
  index: number,
  ext?: string,
  pad?: number,
) => string = (index: number, ext: string = "png", pad: number = 5): string =>
  `frame_${String(index).padStart(pad, "0")}.${ext}`;
