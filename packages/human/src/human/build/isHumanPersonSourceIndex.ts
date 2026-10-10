/**
 * Whether a value is a safe integer index into a population of `count`.
 */
export function isHumanPersonSourceIndex(
  value: number,
  count: number,
): boolean {
  return Number.isSafeInteger(value) && value >= 0 && value < count;
}
