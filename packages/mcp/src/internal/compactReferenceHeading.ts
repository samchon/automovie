import type { IAutoMovieReferenceHeading } from "../structures/IAutoMovieReference";
import type { ParsedReference } from "./ParsedReference";

/**
 * Project a parsed heading into its public navigation identity without the private body and subtree offsets used to select source text. Index and content reads share this projection instead of reconstructing metadata.
 *
 *
 * @evidence contracts/common.md#principled-implementation Object rest preserves public heading fields while excluding only the private bodyStart and subtreeEnd selection offsets.
 * @evidence contracts/common.md#clear-and-simple-design One shared projection keeps file navigation and selected-heading metadata identical.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No field is synthesized from a fixture or source filename; addressability and authored anchor values remain unchanged.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies the two private offsets and the shared navigation responsibility.
 * @evidence contracts/performance.md#efficient-algorithms A fixed number of heading fields is copied in O(1) work per heading.
 * @evidence contracts/performance.md#reuse-equivalent-work Index and content reads call this same projection instead of maintaining duplicate public-field selections.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One compact heading object transfers to its view owner, sharing authored title and address strings and scalar range metadata; it has no full-body field, handle or resolver. String storage retention depends on the runtime rather than a guaranteed copy ratio.
 */
export function compactReferenceHeading(heading: ParsedReference["headings"][number]): IAutoMovieReferenceHeading {
  const { bodyStart: _bodyStart, subtreeEnd: _subtreeEnd, ...index }: ParsedReference["headings"][number] = heading;
  return index;
}
