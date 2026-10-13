import type { IAutoMovieReferenceContent } from "../structures/IAutoMovieReference";
import type { ParsedReference } from "./ParsedReference";
import { compactReferenceHeading } from "./compactReferenceHeading";
import { retainReferenceSource } from "./retainReferenceSource";
import { fail } from "./referenceError";

type Heading = ParsedReference["headings"][number];

/**
 * Select an exact file or heading subtree and return only its original visible pieces.
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
    const found = parsed.headings.filter(
      (candidate) => candidate.anchor === options.anchor,
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
  const interval =
    heading === null
      ? { start: 0, end: parsed.source.length }
      : { start: heading.bodyStart, end: heading.subtreeEnd };
  const projection = retainReferenceSource(parsed.source, parsed.annotations, interval);
  return {
    file: parsed.file,
    revision: parsed.revision,
    sourceBytes: parsed.sourceBytes,
    contentBytes: Buffer.byteLength(projection.content, "utf8"),
    range: parsed.range(interval),
    heading: heading === null ? null : compactReferenceHeading(heading),
    content: projection.content,
    diagnostics: parsed.unterminated
      .filter((item) => item.start < interval.end && item.end > interval.start)
      .map((item) => ({
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
