/**
 * Binary64 midpoint of two finite coordinates, preserving the ordinary summed-half expression whenever its sum is representable.
 *
 * A finite same-sign pair can overflow on addition although its midpoint is finite. Only that case uses left plus half the difference; opposite-sign finite pairs cannot overflow the sum. Non-finite inputs keep the summed-half expression's propagation. The result is rounded arithmetic, not an exact-real enclosure.
 *
 * @evidence contracts/common.md#principled-implementation Uses (left+right)/2 when finite, and the algebraically equal left+(right-left)/2 only for overflowing finite same-sign operands, whose difference remains finite. This avoids an unnecessary infinite midpoint without changing ordinary expression order.
 * @evidence contracts/common.md#clear-and-simple-design One scalar operation shared by framedBoxOf's bottom centre and propSupportGap's central footprint probe; it owns arithmetic only and validates no geometry or coordinate policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The branch follows finite representability, with no coordinate magnitude threshold, fixture or caller exception; non-finite source values are propagated rather than repaired.
 * @evidence contracts/common.md#meaningful-documentation States finite-coordinate purpose, preserved ordinary arithmetic, overflow fallback, non-finite behavior and binary64 rounding limits.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A fixed number of additions, divisions and finiteness checks takes constant local work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Computes one current scalar pair and coordinates no requests or effects; no result is cached across mutable coordinates.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns one number without allocating records, retaining operands or acquiring resources.
 */
export function midpoint(left: number, right: number): number {
  const sum: number = left + right;
  return !Number.isFinite(sum) &&
    Number.isFinite(left) &&
    Number.isFinite(right)
    ? left + (right - left) / 2
    : sum / 2;
}
