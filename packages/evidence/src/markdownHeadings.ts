import fs from "node:fs";
import type { IAutoMovieEvidenceMarkdownHeading } from "./IAutoMovieEvidenceMarkdownHeading";
import { visibleMarkdownLines } from "./visibleMarkdownLines";

/**
 * Scan projected visible lines for ATX H1 through H6 headings and optional terminal explicit anchors.
 *
 * @evidence contracts/common.md#principled-implementation Scan projected visible lines for ATX H1 through H6 headings and optional terminal explicit anchors.
 * @evidence contracts/common.md#clear-and-simple-design Syntax projection owns fenced-code and comment removal before heading extraction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Headings inside hidden syntax are excluded by the shared parser; this extractor does not certify anchors or document topology.
 * @evidence contracts/common.md#meaningful-documentation Lines are one-based and titles omit terminal anchor syntax; missing anchors remain undefined.
 * @evidence contracts/performance.md#efficient-algorithms Reading and heading scanning add linear text work to full Markdown projection, whose repeated span copies/comment ownership searches take up to O(C L+C H) for L text, C comments and H headings.
 * @evidence contracts/performance.md#reuse-equivalent-work One projected line array serves this scan; repeated calls reread mutable file contents.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The synchronous read closes its handle; returned heading records are caller-owned with no retained file cache.
 */
export function markdownHeadings(file: string): IAutoMovieEvidenceMarkdownHeading[] {
  const output: IAutoMovieEvidenceMarkdownHeading[] = [];
  for (const [index, line] of visibleMarkdownLines(
    fs.readFileSync(file, "utf8"),
  ).entries()) {
    const heading: RegExpExecArray | null = /^(#{1,6})(?!#)\s+(\S.*)$/u.exec(line);
    if (heading === null) continue;
    const depth: 1 | 2 | 3 | 4 | 5 | 6 = heading[1]!.length as 1 | 2 | 3 | 4 | 5 | 6;
    const text: string = heading[2]!;
    const anchored: RegExpExecArray | null = /[ \t]+\{#([^{}\s]+)\}[ \t]*$/u.exec(text);
    output.push({
      anchor: anchored?.[1],
      depth,
      line: index + 1,
      title: text.replace(/[ \t]+\{#[^{}\s]+\}[ \t]*$/u, ""),
    });
  }
  return output;
}
