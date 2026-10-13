import { projectAutoMovieMarkdownSyntax } from "./projectAutoMovieMarkdownSyntax";

/**
 * Use the canonical Markdown syntax projection to remove hidden syntax while preserving original line positions.
 *
 * @evidence contracts/common.md#principled-implementation Use the canonical Markdown syntax projection to remove hidden syntax while preserving original line positions.
 * @evidence contracts/common.md#clear-and-simple-design All factory heading consumers share the existing syntax owner rather than duplicating comment and fence state machines.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The placeholder path is diagnostic context only; projected content is not substituted to meet an expected identity.
 * @evidence contracts/common.md#meaningful-documentation The returned lines retain source numbering and hidden regions as blank lines.
 * @evidence contracts/performance.md#efficient-algorithms Projection scans source bytes and stores its line population; no file I/O is owned by this wrapper.
 * @evidence contracts/performance.md#reuse-equivalent-work One projection supplies the visible line view for the caller; separate calls do not share mutable source snapshots.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns returned projected lines and the wrapper retains no source buffer cache.
 */
export function visibleMarkdownLines(source: string): readonly string[] {
  return projectAutoMovieMarkdownSyntax({
    path: "document.md",
    source,
  }).visibleLines;
}
