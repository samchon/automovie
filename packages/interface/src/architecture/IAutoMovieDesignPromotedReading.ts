import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One reading settled enough to become authored metric geometry.
 *
 * Only candidates built entirely from `line`, `polyline`, and `region` marks
 * reach this record; an `arc`, `text`, or `level-marker` mark is withheld
 * rather than sampled. It is a proposal the building source may accept,
 * reject, or contradict.
 *
 * @evidence contracts/common.md#principled-implementation `promoteDesignObservations` maps source points through settled-scale normalized axes and optional TRS while preserving primitive/point order. Admitted finite scale and coordinates can overflow mapping products/sums, and the producer forwards those results without a final finite-output check. This is a gated authored proposal, not verified metric recognition or guaranteed usable finite geometry.
 * @evidence contracts/common.md#clear-and-simple-design The record carries only the candidate id, its label, and one outline per primitive; it is output of a query and never feeds back into the building source automatically.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Arcs are withheld instead of approximated by chords, disjoint marks are not stitched into one run, and a region is not closed by a repeated point the observer never recorded.
 * @evidence contracts/common.md#meaningful-documentation States which mark families can reach the record, that it is a proposal rather than design, the units and frame of the outlines, their ordering, and why they stay separate and unclosed.
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
