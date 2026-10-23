/**
 * Finds the first unequal projected byte, including unequal EOF.
 *
 * @evidence contracts/common.md#principled-implementation Compare bytes until mismatch; the common length represents unequal EOF.
 * @evidence contracts/common.md#clear-and-simple-design One offset supports substitution and length diagnostics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No text normalization or expected-content exception affects comparison.
 * @evidence contracts/common.md#meaningful-documentation The comment states projected bytes and differing-EOF behavior.
 * @evidence contracts/performance.md#efficient-algorithms Worst-case time scans min(B1,B2) bytes with constant auxiliary space.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing projection buffers are borrowed without copying or hashing again.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The helper retains no buffer references.
 */
export function firstDifference(before: Buffer, after: Buffer): number {
  const length: number = Math.min(before.length, after.length);
  for (let index: number = 0; index < length; index += 1)
    if (before[index] !== after[index]) return index;
  return length;
}
