/** Why a report no longer describes the target in front of a consumer.
 *
 * @evidence contracts/common.md#principled-implementation Represent one exact target-field difference as a field path and reported/current string values; compareAutoMovieRenderTarget derives these rows from sealed target records.
 * @evidence contracts/common.md#clear-and-simple-design A small diagnostic row is independent of report status formatting and does not retain entire target snapshots.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The field is an actual renderer/setting/asset difference, not an expected fixture label or repaired current value.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish the reported measurement target from the current target; strings are diagnostic spellings, not an authority to reseal either record.
 * @evidence contracts/performance.md#efficient-algorithms Each row takes storage proportional to its three string lengths; aggregate drift traversal is owned by the target comparator.
 * @evidence contracts/performance.md#reuse-equivalent-work Summary and consumer logs reuse the comparator's drift rows instead of independently recomputing field differences.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns diagnostic strings for its report lifetime; no target resource, asset bytes or running task is retained.
 * @author Samchon
 */
export interface IAutoMovieRenderTargetDrift {
  /** What changed: the renderer, one setting, or one asset's bytes. */
  field: string;

  /** The value the report was measured against. */
  reported: string;

  /** The value the current target carries. */
  current: string;
}
