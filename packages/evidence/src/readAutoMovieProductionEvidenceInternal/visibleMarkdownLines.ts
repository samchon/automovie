import { projectAutoMovieMarkdownSyntax } from "../projectAutoMovieMarkdownSyntax";


/** Blank Markdown comments and fenced code without changing line addresses.
 *
 * @evidence contracts/common.md#principled-implementation The shared native Markdown projection supplies comment- and code-blanked lines for evidence target heading selection.
 * @evidence contracts/common.md#clear-and-simple-design Target inventory delegates visibility grammar instead of maintaining a second comment parser.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only structural syntax is omitted; this helper applies no semantic or lexical quality judgment.
 * @evidence contracts/common.md#meaningful-documentation The comment states original line-address preservation and visible syntax selection.
 * @evidence contracts/performance.md#efficient-algorithms Cost includes the complete shared projection, including its current repeated comment and heading scans, even though only visibleLines is returned.
 * @evidence contracts/performance.md#reuse-equivalent-work The canonical parser implementation is shared; the call currently also computes unused annotations and claims no parse-result cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only visible line strings escape; other projection arrays become unreachable after return, with no file handle.
 */
export const visibleMarkdownLines: (source: string) => readonly string[] = (source: string): readonly string[] =>
  projectAutoMovieMarkdownSyntax({
    path: "document.md",
    source,
  }).visibleLines;
