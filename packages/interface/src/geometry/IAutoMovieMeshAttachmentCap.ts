/**
 * Conservative contact reach for one declared resident support and a complete
 * fan with a registered root.
 */
export interface IAutoMovieMeshAttachmentCap {
  /**
   * Ordinal of the original resident support triangle, copied from the query's
   * attachment supports.
   */
  triangle: number;

  /**
   * Outward-rounded upper bound in metres on contact distance from the
   * registered root.
   */
  cap: number;
}
