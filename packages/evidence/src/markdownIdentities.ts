import type { IAutoMovieEvidenceHeadingIdentity } from "./IAutoMovieEvidenceHeadingIdentity";
import { markdownHeadings } from "./markdownHeadings";
import { posix } from "./posix";

/**
 * Require configured H2/H3/H4 depths, explicit unique anchors and valid parent order before producing anchor lineage.
 *
 * @evidence contracts/common.md#principled-implementation Require configured H2/H3/H4 depths, explicit unique anchors and valid parent order before producing anchor lineage.
 * @evidence contracts/common.md#clear-and-simple-design Heading extraction and authored identity admission remain separate so target and host validators share the same grammar.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported depths, empty configured depth populations and orphan nested units throw rather than receiving synthesized identities.
 * @evidence contracts/common.md#meaningful-documentation Returned identities include one-based lines, titles and slash-joined parent lineage in source order.
 * @evidence contracts/performance.md#efficient-algorithms Hash sets give linear heading admission after document parsing; lineage storage follows the selected heading population.
 * @evidence contracts/performance.md#reuse-equivalent-work Parsed headings are reused within the call, but other consumers currently parse the same file separately.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Sets and parent variables are call-local; caller-owned output grows with authored headings and has no fixed population cap.
 */
export function markdownIdentities(file: string, headings: readonly (2 | 3 | 4)[]): IAutoMovieEvidenceHeadingIdentity[] {
  const required: Set<2 | 3 | 4> = new Set(headings);
  const seenDepths: Set<number> = new Set<number>();
  const anchors: Set<string> = new Set<string>();
  const output: IAutoMovieEvidenceHeadingIdentity[] = [];
  let h2: string | undefined;
  let h3: string | undefined;
  for (const heading of markdownHeadings(file)) {
    if (heading.depth === 1) continue;
    const depth: 2 | 3 | 4 | undefined =
      heading.depth === 2 || heading.depth === 3 || heading.depth === 4
        ? heading.depth
        : undefined;
    if (depth === undefined || !required.has(depth))
      throw new Error(
        `${posix(file)}:${heading.line} uses H${heading.depth} outside the configured ${headings.map((value: 2 | 3 | 4): string => `H${value}`).join("/")} authored-unit topology.`,
      );
    seenDepths.add(depth);
    const anchor: string | undefined = heading.anchor;
    if (anchor === undefined)
      throw new Error(
        `${posix(file)}:${heading.line} has an active H${depth} without an explicit {#anchor}.`,
      );
    if (anchors.has(anchor))
      throw new Error(
        `${posix(file)}:${heading.line} repeats #${anchor}; anchors are unique within one file.`,
      );
    anchors.add(anchor);
    if (depth === 2) {
      h2 = anchor;
      h3 = undefined;
    } else if (depth === 3) {
      if (h2 === undefined)
        throw new Error(
          `${posix(file)}:${heading.line} has an H3 before an H2.`,
        );
      h3 = anchor;
    } else if (h2 === undefined || h3 === undefined)
      throw new Error(
        `${posix(file)}:${heading.line} has an H4 before its H2/H3 parents.`,
      );
    output.push({
      anchor,
      depth,
      lineage: [
        h2,
        depth >= 3 ? h3 : undefined,
        depth === 4 ? anchor : undefined,
      ]
        .filter((value: string | undefined): value is string => value !== undefined)
        .join("/"),
      line: heading.line,
      title: heading.title,
    });
  }
  for (const depth of headings)
    if (!seenDepths.has(depth))
      throw new Error(`${posix(file)} is active but has no H${depth} unit.`);
  return output;
}
