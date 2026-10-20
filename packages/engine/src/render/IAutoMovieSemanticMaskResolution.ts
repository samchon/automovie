import { IAutoMovieSemanticMaskEntry } from "@automovie/interface";

/** A matched mask entry with the reachable ownership prefix above it.
 *
 * @evidence contracts/common.md#principled-implementation Return borrowed matching entry and tightest-to-outermost reachable owners; resolveAutoMovieSemanticMask stops at root, missing link or cycle, so the result does not certify a complete admitted graph.
 * @evidence contracts/common.md#clear-and-simple-design The result separates one color owner from its containment ancestry, as resolveAutoMovieSemanticMask traverses the ownership graph.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing/cyclic links retain only the reachable prefix without invented containers; empty ancestry can mean root or immediate malformed linkage and is not evidence of graph validity.
 * @evidence contracts/common.md#meaningful-documentation Members identify the borrowed matching entry and ancestor order; resolution/invalid-chain policy belongs to the producer.
 * @evidence contracts/performance.md#efficient-algorithms One result retains O(H) ancestor references for ownership depth H; lookup/traversal cost remains with resolveAutoMovieSemanticMask.
 * @evidence contracts/performance.md#reuse-equivalent-work Entries are borrowed from the supplied mask, which this lookup does not validate; changing entries or ownership requires new resolution rather than an identity-only persistent cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the ancestor array while entries remain mask-owned; no color buffer, handle or task is retained.
 */
export interface IAutoMovieSemanticMaskResolution {
  /** The entry that owns the colour. */
  entry: IAutoMovieSemanticMaskEntry;

  /** Reachable owners outward; root, missing link or cycle ends the prefix. */
  ancestors: IAutoMovieSemanticMaskEntry[];
}
