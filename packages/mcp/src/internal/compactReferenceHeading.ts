import type { IAutoMovieReferenceHeading } from "../structures/IAutoMovieReference";
import type { ParsedReference } from "./ParsedReference";

/**
 * Project a parsed heading into its public navigation identity without the
 * private body and subtree offsets used to select source text. Index and
 * content reads share this projection instead of reconstructing metadata.
 *
 * @evidence requirements/agent-authoring/reference-navigation.md#agent-reference-selection Keeps the original heading identity and navigation metadata from the parsed snapshot.
 * @evidence specifications/authoring-and-authority/reference-navigation.md#spec-reference-selection Omits selection-only offsets from the public heading while preserving all indexed fields.
 */
export function compactReferenceHeading(heading: ParsedReference["headings"][number]): IAutoMovieReferenceHeading {
  const { bodyStart: _bodyStart, subtreeEnd: _subtreeEnd, ...index } = heading;
  return index;
}
