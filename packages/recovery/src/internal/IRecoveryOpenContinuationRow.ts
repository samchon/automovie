import type { RecoveryOpenSlabGraph as O } from "./RecoveryOpenSlabGraph";

/**
 * Transient source support for one saved open-section row.
 *
 * @evidence contracts/development/design.md#principled-representation Source support and saved ordinals bind observed arcs to their original coefficients.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One private row record supports the adjacent-section cache.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Private face support is never copied into the public continuation.
 * @evidence contracts/development/common.md#meaningful-documentation Members distinguish real arcs, saved ordinals, missing observations and defective supports.
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
