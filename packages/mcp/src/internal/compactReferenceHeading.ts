import type { IAutoMovieReferenceHeading } from "../structures/IAutoMovieReference";
import type { ParsedReference } from "./ParsedReference";

/**
 * Project a parsed heading into its public navigation identity without the
 * private body and subtree offsets used to select source text. Index and
 * content reads share this projection instead of reconstructing metadata.
 */
export function compactReferenceHeading(heading: ParsedReference["headings"][number]): IAutoMovieReferenceHeading {
  const { bodyStart: _bodyStart, subtreeEnd: _subtreeEnd, ...index } = heading;
  return index;
}
