import type { IAutoMovieReferenceFileIndex } from "../structures/IAutoMovieReference";
import type { ParsedReference } from "./ParsedReference";
import { compactReferenceHeading } from "./compactReferenceHeading";

/**
 * Project a snapshot into compact file navigation without per-comment arrays.
 *
 *
 * @evidence contracts/common.md#principled-implementation Snapshot headings provide the first real H1 title and compact H2 through H4 navigation, with original full-file range and unterminated-comment notices.
 * @evidence contracts/common.md#clear-and-simple-design One projection removes private subtree offsets through compactReferenceHeading and excludes body text from navigation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A filename never becomes a fabricated title, and unanchored or ambiguous headings retain their original addressability.
 * @evidence contracts/common.md#meaningful-documentation The comment states compact navigation; result members document source revision, byte extent and original ranges.
 * @evidence contracts/performance.md#efficient-algorithms For H headings and U unterminated comments, scans are O(H plus U), with coordinate lookup costs inherited from the snapshot's binary search.
 * @evidence contracts/performance.md#reuse-equivalent-work Revision and ranges come from the existing parse; navigation performs no reread or second Markdown parse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned navigation object retains heading metadata and ranges without the parsed source body or descriptor.
 */
export function indexReference(
  parsed: ParsedReference,
): IAutoMovieReferenceFileIndex {
  return {
    file: parsed.file,
    revision: parsed.revision,
    sourceBytes: parsed.sourceBytes,
    title:
      parsed.headings.find((heading: ParsedReference["headings"][number]) : boolean => heading.depth === 1)?.title ?? null,
    range: parsed.range({ start: 0, end: parsed.source.length }),
    headings: parsed.headings
      .filter((heading: ParsedReference["headings"][number]) : boolean => heading.depth >= 2 && heading.depth <= 4)
      .map(compactReferenceHeading),
    diagnostics: parsed.unterminated.map((interval: ParsedReference["annotations"][number]) : IAutoMovieReferenceFileIndex["diagnostics"][number] => ({
      code: "UNTERMINATED_ANNOTATION",
      range: parsed.range(interval),
    })),
  };
}
