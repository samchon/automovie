import type { IMarkdownHeading } from "./IMarkdownHeading";
import { visibleMarkdownLines } from "./visibleMarkdownLines";
import { markdownSlug } from "./markdownSlug";


/** Extract visible ATX headings while ignoring comments and fenced examples.
 *
 * @evidence contracts/common.md#principled-implementation Visible ATX syntax accepts supported indentation and closing hashes; explicit anchors or native Unicode slugs supply target identity.
 * @evidence contracts/common.md#clear-and-simple-design One target-heading scan owns evidence addressing grammar, separate from compact document-title extraction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Comment and fenced-example headings are excluded; slug inference is native evidence target policy rather than an invented user-editing address.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies visible ATX extraction and the returned original line and depth.
 * @evidence contracts/performance.md#efficient-algorithms For L visible text and H titles, scanning and slug construction are O(L+title characters) with a heading array.
 * @evidence contracts/performance.md#reuse-equivalent-work One visible-line population serves the complete file's target heading inventory.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only heading metadata escapes; projected text and temporary match arrays are released after return.
 */
export const markdownHeadings: (source: string) => IMarkdownHeading[] = (source: string): IMarkdownHeading[] => {
  const output: IMarkdownHeading[] = [];
  for (const [index, line] of visibleMarkdownLines(source).entries()) {
    const heading: RegExpExecArray | null = /^ {0,3}(#{1,6})(?!#)(?:[ \t]+(.*)|[ \t]*)$/u.exec(line);
    if (heading === null) continue;
    let rawTitle: string = (heading[2] ?? "").trim();
    const withoutClosingHashes: string = rawTitle.replace(/[ \t]+#+[ \t]*$/u, "");
    if (withoutClosingHashes !== rawTitle)
      rawTitle = withoutClosingHashes.trim();
    const anchored: RegExpExecArray | null = /[ \t]*\{#([A-Za-z0-9][A-Za-z0-9._:-]*)\}[ \t]*$/u.exec(
      rawTitle,
    );
    const title: string = rawTitle
      .replace(/[ \t]*\{#[A-Za-z0-9][A-Za-z0-9._:-]*\}[ \t]*$/u, "")
      .trim();
    output.push({
      anchor: anchored?.[1] ?? (markdownSlug(title) || undefined),
      depth: heading[1]!.length,
      line: index + 1,
      title,
    });
  }
  return output;
};
