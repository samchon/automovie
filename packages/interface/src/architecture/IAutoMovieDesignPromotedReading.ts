import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One reading settled enough to become authored metric geometry.
 *
 * Only candidates built entirely from `line`, `polyline`, and `region` marks
 * reach this record; an `arc` is withheld rather than sampled. It is a
 * proposal the building source may accept, reject, or contradict.
 *
 * @evidence contracts/common.md#principled-implementation Maps every point through `designReferenceWorldPoint`: anchor offset times the settled metres per unit along the normalized frame axes from `origin`, then the frame's optional scale, rotation, and translation; one polyline per primitive keeps disjoint marks unjoined.
 * @evidence contracts/common.md#clear-and-simple-design The candidate id, its semantic copied verbatim, and nested outlines; no closing point is appended, so a `region` outline's last edge back to its first point stays implicit.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Arcs are excluded rather than approximated by sampled chords, and no semantic label changes how a reading is mapped.
 * @evidence contracts/common.md#meaningful-documentation States the world frame and metre unit, primitive and point ordering, why outlines stay separate, the implicit region closure, and which primitive kinds can appear.
 * @author Samchon
 */
export interface IAutoMovieDesignPromotedReading {
  /** Candidate that produced it. */
  candidate: string;

  /** The candidate's own semantic label. */
  semantic: string;

  /**
   * One world-space polyline in metres per primitive the candidate reads, in
   * the candidate's own primitive order and each in source point order.
   *
   * They stay separate rather than concatenated because a candidate built from
   * two disjoint marks is two runs, and a single flattened list would join them
   * with a segment nobody drew. A `region` is not closed by repeating its first
   * point.
   */
  outlines: IAutoMovieVector3[][];
}
