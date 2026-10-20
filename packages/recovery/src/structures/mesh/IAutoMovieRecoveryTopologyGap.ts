/**
 * Physical slicing interval for which no supported surface topology is published.
 *
 * @evidence contracts/common.md#principled-implementation The two measured section coordinates delimit the slab that reconstruction must leave open.
 * @evidence contracts/common.md#clear-and-simple-design One interval record keeps its physical limits beside the unresolved cause.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The interval supplies neither replacement geometry nor a topology repair.
 * @evidence contracts/common.md#meaningful-documentation Members document physical units, ownership and optional-state meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The declaration owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the declared records and arrays.
 */
export interface IAutoMovieRecoveryTopologyGap {
  /** Lower section coordinate along the slicing axis, millimetres. */
  beforeMm: number;

  /** Upper section coordinate along the slicing axis, millimetres. */
  afterMm: number;

  /** Why reconstruction cannot consume this interval as supported topology. */
  reason: string;
}
