/**
 * One serviceSegmentClashes pair in network declaration order.
 *
 * @evidence contracts/development/design.md#principled-representation Earlier and later run ids identify one unordered pair once, matching the producer's triangular pair scan.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two ids supply validator diagnostics without retaining run geometry or duplicating network records.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The pair reports conservative swept-box overlap, without implying exact circular-pipe contact or a discipline-specific exemption.
 * @evidence contracts/development/common.md#meaningful-documentation Names the producer, declaration ordering and approximation so consumers can interpret the two ids.
 */
export interface IAutoMovieServiceClash {
  /** Id of the earlier-declared segment. */
  left: string;
  /** Id of the later-declared segment. */
  right: string;
}
