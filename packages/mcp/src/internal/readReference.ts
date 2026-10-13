import type { IAutoMovieReferenceContent } from "../structures/IAutoMovieReference";
import type { ParsedReference } from "./ParsedReference";
import { compactReferenceHeading } from "./compactReferenceHeading";
import { retainReferenceSource } from "./retainReferenceSource";
import { fail } from "./fail";

type Heading = ParsedReference["headings"][number];

/**
 * Select an exact file or heading subtree and return only its original visible pieces.
 *
 *
 * @evidence contracts/common.md#principled-implementation Expected revision must match; an exact unique H2 through H4 anchor selects its original body and descendant span, whose parsed comments are omitted losslessly.
 * @evidence contracts/common.md#clear-and-simple-design Selection, stale checks and optional piece-map publication use one parsed snapshot and shared omission helper.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing, ambiguous or unsupported anchors refuse, and oversized-result handling remains the provider's complete-envelope responsibility.
 * @evidence contracts/common.md#meaningful-documentation Options document exact anchor, stale revision and opt-in detail; result metadata identifies the selected original interval and retained source text.
 * @evidence contracts/performance.md#efficient-algorithms Anchor selection scans H headings, omission selects K comments in O(log(A + 1) plus K), and diagnostics scan U unterminated intervals. For T line starts, selected and diagnostic coordinates plus optional detail ranges cost O((K + U + 1) log(T + 1)) in the upper bound; content copying and UTF-8 byte counting inspect the selected text. Results remain invocation-local.
 * @evidence contracts/performance.md#reuse-equivalent-work Digest, ancestry and comment positions are reused from the supplied snapshot; detail maps use the same retained slices as content.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned text and optional span arrays transfer to the response owner; the parsed source remains caller-owned and no I/O is initiated.
 */
export function readReference(
  parsed: ParsedReference,
  options: {

    /** Explicit authored anchor; absent selects the whole file rather than one subtree. */
    anchor?: string;

    /** Source SHA-256 from navigation; a mismatch refuses the current snapshot. */
    expectedDigest?: string;

    /** Include original retained and omitted ranges only when explicitly true. */
    detail?: boolean;
  },
): IAutoMovieReferenceContent {
  if (
    options.expectedDigest !== undefined &&
    options.expectedDigest !== parsed.revision
  )
    fail(
      "STALE_REFERENCE",
      "Source changed; fetch a fresh file index and use its revision.",
    );
  let heading: Heading | null = null;
  if (options.anchor !== undefined) {
    const found: Heading[] = parsed.headings.filter(
      (candidate: Heading) : boolean => candidate.anchor === options.anchor,
    );
    if (found.length === 0)
      fail(
        "MISSING_SECTION",
        "No heading declares this anchor; fetch the file index.",
      );
    if (found.length > 1)
      fail(
        "AMBIGUOUS_ANCHOR",
        "Multiple headings declare this anchor; inspect the canonical source.",
      );
    heading = found[0];
    if (heading.depth < 2 || heading.depth > 4)
      fail("UNSUPPORTED_DEPTH", "Section reads support only H2, H3 and H4.");
  }
  const interval: ParsedReference["annotations"][number] =
    heading === null
      ? { start: 0, end: parsed.source.length }
      : { start: heading.bodyStart, end: heading.subtreeEnd };
  const projection: ReturnType<typeof retainReferenceSource> = retainReferenceSource(parsed.source, parsed.annotations, interval);
  return {
    file: parsed.file,
    revision: parsed.revision,
    sourceBytes: parsed.sourceBytes,
    contentBytes: Buffer.byteLength(projection.content, "utf8"),
    range: parsed.range(interval),
    heading: heading === null ? null : compactReferenceHeading(heading),
    content: projection.content,
    diagnostics: parsed.unterminated
      .filter((item: ParsedReference["annotations"][number]) : boolean => item.start < interval.end && item.end > interval.start)
      .map((item: ParsedReference["annotations"][number]) : IAutoMovieReferenceContent["diagnostics"][number] => ({
        code: "UNTERMINATED_ANNOTATION",
        range: parsed.range(item),
      })),
    ...(options.detail === true
      ? {
          projection: {
            contentRanges: projection.contentRanges.map(parsed.range),
            annotationRanges: projection.annotationRanges.map(parsed.range),
          },
        }
      : {}),
  };
}
