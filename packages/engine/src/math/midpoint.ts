/**
 * Binary64 midpoint of two finite coordinates, preserving the ordinary summed-half expression whenever its sum is representable.
 *
 * A finite same-sign pair can overflow on addition although its midpoint is finite. Only that case uses left plus half the difference; opposite-sign finite pairs cannot overflow the sum. Non-finite inputs keep the summed-half expression's propagation. The result is rounded arithmetic, not an exact-real enclosure.
 */
export function midpoint(left: number, right: number): number {
  const sum: number = left + right;
  return !Number.isFinite(sum) &&
    Number.isFinite(left) &&
    Number.isFinite(right)
    ? left + (right - left) / 2
    : sum / 2;
}
