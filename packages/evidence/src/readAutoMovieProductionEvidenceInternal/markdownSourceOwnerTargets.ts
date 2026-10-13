import fs from "node:fs";
import path from "node:path";

import type { IMarkdownHeading } from "./IMarkdownHeading";
import type { IMarkdownSourceOwnerTarget } from "./IMarkdownSourceOwnerTarget";
import { markdownHeadings } from "./markdownHeadings";
import { posix } from "./posix";

/**
 * Read exact native Markdown target addresses from one controlled document.
 *
 * @evidence contracts/common.md#principled-implementation Native heading syntax supplies explicit or implicit anchors and original depth; canonical project and population-relative paths bind each address to its already admitted document.
 * @evidence contracts/common.md#clear-and-simple-design The reader's citation join needs address and depth only, so target selection carries neither authored-text review fingerprints nor an automatic semantic verdict.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only visible supported heading depths with an actual native anchor enter the target population; no fixture or review metadata manufactures an address.
 * @evidence contracts/common.md#meaningful-documentation The comment states controlled-document admission and native address formation; returned fields identify exact path, anchor, depth and population-relative citation.
 * @evidence contracts/performance.md#efficient-algorithms For L source characters and H visible headings, one read and shared syntax projection dominate, followed by O(H) target mapping; no subtree population or composite text hash is rebuilt.
 * @evidence contracts/performance.md#reuse-equivalent-work One heading inventory serves all addresses from this document; the caller shares the resulting target map across selected source exports in a binding.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only target-address strings and depths escape; synchronous reads close internally and source text and heading arrays remain call-local without a source-size cap here.
 */
export function markdownSourceOwnerTargets(
  projectRoot: string,
  populationRoot: string,
  file: string,
): IMarkdownSourceOwnerTarget[] {
  const source: string = fs.readFileSync(file, "utf8").replace(/\r\n?/gu, "\n");
  const relative: string = posix(
    path.relative(path.resolve(projectRoot, populationRoot), file),
  );
  return markdownHeadings(source)
    .filter((heading: IMarkdownHeading): boolean => heading.depth <= 4 && heading.anchor !== undefined)
    .map((heading: IMarkdownHeading): IMarkdownSourceOwnerTarget => ({
      path: posix(path.relative(projectRoot, file)),
      anchor: heading.anchor!,
      depth: heading.depth,
      relativeTarget: `${relative}#${heading.anchor!}`,
    }));
}
