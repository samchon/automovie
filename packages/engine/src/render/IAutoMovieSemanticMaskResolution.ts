import { IAutoMovieSemanticMaskEntry } from "@automovie/interface";

/** A matched mask entry with the reachable ownership prefix above it.
 *
 * @evidence contracts/development/design.md#principled-representation Return borrowed matching entry and tightest-to-outermost reachable owners; resolveAutoMovieSemanticMask stops at root, missing link or cycle, so the result does not certify a complete admitted graph.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The result separates one color owner from its containment ancestry, as resolveAutoMovieSemanticMask traverses the ownership graph.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing/cyclic links retain only the reachable prefix without invented containers; empty ancestry can mean root or immediate malformed linkage and is not evidence of graph validity.
 * @evidence contracts/development/common.md#meaningful-documentation Members identify the borrowed matching entry and ancestor order; resolution/invalid-chain policy belongs to the producer.
 */
export interface IAutoMovieSemanticMaskResolution {
  /** The entry that owns the colour. */
  entry: IAutoMovieSemanticMaskEntry;

  /** Reachable owners outward; root, missing link or cycle ends the prefix. */
  ancestors: IAutoMovieSemanticMaskEntry[];
}
