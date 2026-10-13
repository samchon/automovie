import { canonicalizeAutoMovieCaptionText } from "./canonicalizeAutoMovieCaptionText";
import { escapeWebVttText } from "./escapeWebVttText";

/**
 * Serialize one authored caption as a WebVTT cue payload.
 *
 * The caption is canonicalized first, so the payload shows exactly the lines
 * readability measured. Each line is escaped, and an empty line becomes the
 * empty class span `<c></c>`, which keeps a visible line without writing a
 * blank line that would end the cue block.
 *
 * @evidence contracts/common.md#principled-implementation WebVTT ends a cue at the first empty line, and an empty `<c>` span renders no text, so replacing only empty lines with it preserves the line structure while every other line is escaped with the WebVTT character references.
 * @evidence contracts/common.md#clear-and-simple-design Normalization belongs to `canonicalizeAutoMovieCaptionText` and escaping to `escapeWebVttText`; this function adds only the per-line blank-line rule that applies to payloads alone.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The `<c></c>` span is the WebVTT class span used for its specified empty rendering, not a marker any reader recognizes, and no caption is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The doc states the canonicalization it applies, the escape, and why an empty line becomes an empty class span.
 * @evidence contracts/performance.md#efficient-algorithms Normalization, split, per-line escape and join are each linear in the caption length, so a caption of L characters costs O(L) time and space.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure per-caption serialization shares no work across calls or consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The intermediate line array is released on return, and the function keeps no state, handle or task.
 */
export const serializeAutoMovieWebVttCueText = (value: string): string =>
  canonicalizeAutoMovieCaptionText(value)
    .split("\n")
    .map((line: string): string =>
      line.length === 0 ? "<c></c>" : escapeWebVttText(line),
    )
    .join("\n");
