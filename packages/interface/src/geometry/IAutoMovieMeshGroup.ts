/** One assembly member's contiguous span of triangle index entries. */
export interface IAutoMovieMeshGroup {
  /**
   * Original assembly member ID, copied unchanged after duplicate checking.
   *
   * The ID identifies an index range that consumers can bind to a finish or
   * distinguish in a quantity calculation.
   */
  id: string;

  /**
   * Zero-based entry offset in the merged indices array. For zero-count members
   * this marks the next write position.
   */
  start: number;

  /**
   * Number of index entries in this range, divisible by three. An empty member
   * contributes zero.
   */
  count: number;
}
