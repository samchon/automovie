import type { IAutoMovieReferenceFileIndex } from "../structures/IAutoMovieReference";
import type { ParsedReference } from "./ParsedReference";
import { compactReferenceHeading } from "./compactReferenceHeading";

/**
 * Project a snapshot into compact file navigation without per-comment arrays.
 *
 * @evidence requirements/agent-authoring/reference-navigation.md#agent-reference-selection Exposes actual heading order and original title without inventing missing units.
 * @evidence specifications/authoring-and-authority/reference-navigation.md#spec-reference-selection Selects H2/H3/H4 index entries while retaining the optional H1 title.
 */
export function indexReference(
  parsed: ParsedReference,
): IAutoMovieReferenceFileIndex {
  return {
    file: parsed.file,
    revision: parsed.revision,
    sourceBytes: parsed.sourceBytes,
    title:
      parsed.headings.find((heading) => heading.depth === 1)?.title ?? null,
    range: parsed.range({ start: 0, end: parsed.source.length }),
    headings: parsed.headings
      .filter((heading) => heading.depth >= 2 && heading.depth <= 4)
      .map(compactReferenceHeading),
    diagnostics: parsed.unterminated.map((interval) => ({
      code: "UNTERMINATED_ANNOTATION",
      range: parsed.range(interval),
    })),
  };
}
