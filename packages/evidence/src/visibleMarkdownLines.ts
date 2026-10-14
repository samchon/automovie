import { projectAutoMovieMarkdownSyntax } from "./projectAutoMovieMarkdownSyntax";

/**
 * Use the canonical Markdown syntax projection to remove hidden syntax while preserving original line positions.
 *
 * @evidence contracts/common.md#principled-implementation Use the canonical Markdown syntax projection to remove hidden syntax while preserving original line positions.
 * @evidence contracts/common.md#clear-and-simple-design All factory heading consumers share the existing syntax owner rather than duplicating comment and fence state machines.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The placeholder path is diagnostic context only; projected content is not substituted to meet an expected identity.
 * @evidence contracts/common.md#meaningful-documentation The returned lines retain source numbering and hidden regions as blank lines.
 * @evidence contracts/performance.md#efficient-algorithms The full projector also computes annotations discarded here; repeated span copies/comment heading searches take up to O(C L+C H) for L text, C comments and H headings, without wrapper file I/O.
 * @evidence contracts/performance.md#reuse-equivalent-work One full projection supplies the visible line view; annotation work is currently unused by this wrapper and separate calls do not share mutable source snapshots.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns returned projected lines and the wrapper retains no source buffer cache.
 */
export function visibleMarkdownLines(source: string): readonly string[] {
  return projectAutoMovieMarkdownSyntax({
    path: "document.md",
    source,
  }).visibleLines;
}
