/*
 * Count one directed matching traversal. A target population needs two
 * descriptors before the nearest/second-nearest test can compare any pair.
 */
export function countRecoveryImageDescriptorComparisons(
  sourceCount: number,
  targetCount: number,
): number {
  return targetCount < 2 ? 0 : sourceCount * targetCount;
}
