/*
 * Binary64 midpoint of two finite coordinates, preserving the ordinary
 * summed-half expression whenever its sum is representable.
 *
 * A same-sign pair past half the largest double can overflow on addition
 * although its midpoint is finite. Only that case uses left plus half the
 * difference; opposite-sign pairs cannot overflow the sum. The result is
 * rounded arithmetic, not an exact-real enclosure.
 */
export function midpoint(left: number, right: number): number {
  const half: number = Number.MAX_VALUE / 2;
  const overflows: boolean =
    (left > half && right > half) || (left < -half && right < -half);
  return overflows ? left + (right - left) / 2 : (left + right) / 2;
}
