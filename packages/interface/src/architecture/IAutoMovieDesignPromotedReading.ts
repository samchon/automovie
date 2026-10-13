import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** One reading settled enough to become authored metric geometry. */
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
   * with a segment nobody drew.
   */
  outlines: IAutoMovieVector3[][];
}
