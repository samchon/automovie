import type { AutoMovieGuidePass } from "@automovie/interface";


/**
 * Append the pass tag to an extension; beauty uses the untagged extension.
 * Both frame-name and encoder-pattern producers use this same spelling.
 *
 * @evidence contracts/common.md#principled-implementation A non-beauty pass becomes an extension segment before the media suffix, while beauty preserves the documented single-pass filename convention.
 * @evidence contracts/common.md#clear-and-simple-design One formatter supplies the common pass-tag rule to guidePassFrameName and guidePassFramePattern without duplicating their numbering logic.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Beauty's untagged path is the supported filename convention; every other admitted pass uses the same interpolation and no consumer is recognized.
 * @evidence contracts/common.md#meaningful-documentation The comment states the beauty exception and the two naming consumers whose extensions must agree.
 * @evidence contracts/performance.md#efficient-algorithms Returning beauty's existing extension is constant work, while another pass allocates one string proportional to the pass name and suffix length.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Formatting one extension does not coordinate requests; the callers share the rule rather than a cache keyed by short strings.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The returned extension retains only string data; the formatter keeps no pass history and opens no output file.
 */
export const passExtension: (pass: AutoMovieGuidePass, ext: string) => string = (pass: AutoMovieGuidePass, ext: string): string =>
  pass === "beauty" ? ext : `${pass}.${ext}`;
