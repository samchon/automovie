
/**
 * One serviceSegmentClashes pair in network declaration order.
 *
 * @evidence contracts/common.md#principled-implementation Earlier and later run ids identify one unordered pair once, matching the producer's triangular pair scan.
 * @evidence contracts/common.md#clear-and-simple-design Two ids supply validator diagnostics without retaining run geometry or duplicating network records.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The pair reports conservative swept-box overlap, without implying exact circular-pipe contact or a discipline-specific exemption.
 * @evidence contracts/common.md#meaningful-documentation Names the producer, declaration ordering and approximation so consumers can interpret the two ids.
 * @evidenceExclude contracts/performance.md#efficient-algorithms No pair comparison runs in this interface; span scans belong to serviceSegmentClashes.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A clash row carries one computed pair and owns no cache shared with later network versions.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only two primitive run ids are retained in the caller-owned result, without source node or span references.
 * @author Samchon
 */
export interface IAutoMovieServiceClash {
  /** Id of the earlier-declared segment. */
  left: string;
  /** Id of the later-declared segment. */
  right: string;
}
