import type { IAutoMovieReferenceContent } from "../structures/IAutoMovieReference";
import type { ParsedReference } from "./ParsedReference";
import { compactReferenceHeading } from "./compactReferenceHeading";
import { retainReferenceSource } from "./retainReferenceSource";
import { fail } from "./referenceError";

type Heading = ParsedReference["headings"][number];

/**
 * Select an exact file or heading subtree and return only its original visible pieces.
 *
 * @evidence requirements/agent-authoring/reference-navigation.md#agent-reference-source Keeps source digest, content and optional reconstruction ranges on the same snapshot.
 * @evidence requirements/agent-authoring/reference-navigation.md#agent-reference-selection Refuses missing, ambiguous or unsupported anchors instead of guessing a nearby section.
 * @evidence specifications/authoring-and-authority/reference-navigation.md#spec-reference-source Rejects stale digests and returns ordered original intervals for detail reads.
 * @evidence specifications/authoring-and-authority/reference-navigation.md#spec-reference-selection Separates selected-heading metadata and ends the body at the next same-or-shallower heading.
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
