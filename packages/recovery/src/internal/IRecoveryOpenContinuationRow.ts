import type { RecoveryOpenSlabGraph as O } from "./RecoveryOpenSlabGraph";

/**
 * Transient source support for one saved open-section row.
 *
 * @evidence contracts/common.md#principled-implementation Source support and saved ordinals bind observed arcs to their original coefficients.
 * @evidence contracts/common.md#clear-and-simple-design One private row record supports the adjacent-section cache.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Private face support is never copied into the public continuation.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish real arcs, saved ordinals, missing observations and defective supports.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The interface performs no traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Row reuse belongs to the observer loop.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The observation call owns and releases row supports.
 */
export interface IRecoveryOpenContinuationRow {
  /** Observed open arcs with private source support. */
  arcs: O.Arc[];

  /** Saved coefficient ordinal corresponding to each observed arc. */
  ordinals: number[];

  /** Saved open-curve ordinals lacking an identical endpoint-bound observation. */
  missing: number[];

  /** Private source face groups that prevent ordinary slab admission. */
  defects: Set<number>[];
}
