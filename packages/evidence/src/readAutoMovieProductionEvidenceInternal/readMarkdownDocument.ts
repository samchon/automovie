import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { parseAutoMovieEvidenceMarkdownHeadings } from "../parseAutoMovieEvidenceMarkdownHeadings";
import type { IMarkdownDocument } from "./IMarkdownDocument";
import { posix } from "./posix";


/** Parse one governed Markdown document outside comments and fenced code.
 *
 * @evidence contracts/common.md#principled-implementation A governed Markdown file supplies its real H1 and ordered H2 units; each canonical LF H2 span is hashed through the next H2 or EOF.
 * @evidence contracts/common.md#clear-and-simple-design One document projection serves design owners and local contract inventory.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The upstream governed graph must provide a sole H1 and explicit H2 anchors; this reader currently relies on that premise rather than performing a second admission check.
 * @evidence contracts/common.md#meaningful-documentation The comment states governed source parsing and result records preserve exact path, title and units.
 * @evidence contracts/performance.md#efficient-algorithms For L text and H headings, source reading, heading scanning and disjoint H2 hashing are O(L+H), with source and line arrays retained during projection.
 * @evidence contracts/performance.md#reuse-equivalent-work One source read and heading population serve every H2 digest in the document.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only metadata and digest strings escape; synchronous reads close internally and source/line arrays are released after return.
 */
export const readMarkdownDocument: (root: string, file: string) => IMarkdownDocument = (
  root: string,
  file: string,
): IMarkdownDocument => {
  const source: string = fs.readFileSync(file, "utf8").replaceAll("\r\n", "\n");
  const lines: string[] = source.split("\n");
  const headings: ReturnType<typeof parseAutoMovieEvidenceMarkdownHeadings>[number][] = parseAutoMovieEvidenceMarkdownHeadings(source);
  const h1: ReturnType<typeof parseAutoMovieEvidenceMarkdownHeadings>[number] = headings.find((heading: ReturnType<typeof parseAutoMovieEvidenceMarkdownHeadings>[number]) : boolean => heading.depth === 1)!;
  const h2: ReturnType<typeof parseAutoMovieEvidenceMarkdownHeadings>[number][] = headings.filter((heading: ReturnType<typeof parseAutoMovieEvidenceMarkdownHeadings>[number]) : boolean => heading.depth === 2);
  return {
    path: posix(path.relative(root, file)),
    title: h1.title,
    units: h2.map((heading: ReturnType<typeof parseAutoMovieEvidenceMarkdownHeadings>[number], index: number) : { anchor: string; title: string; digest: string; } => {
      const next: ReturnType<typeof parseAutoMovieEvidenceMarkdownHeadings>[number] = h2[index + 1];
      const canonical: string = lines
        .slice(
          heading.line - 1,
          next === undefined ? lines.length : next.line - 1,
        )
        .join("\n");
      return {
        anchor: heading.anchor!,
        title: heading.title,
        digest: crypto.createHash("sha256").update(canonical).digest("hex"),
      };
    }),
  };
};
