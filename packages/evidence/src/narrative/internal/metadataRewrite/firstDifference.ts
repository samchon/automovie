/**
 * Finds the first unequal projected byte, including unequal EOF.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Compare bytes until mismatch; the common length represents unequal EOF.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One offset supports substitution and length diagnostics.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No text normalization or expected-content exception affects comparison.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states projected bytes and differing-EOF behavior.
 * @evidence contracts/development/implementation.md#efficient-algorithms Worst-case time scans min(B1,B2) bytes with constant auxiliary space.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Existing projection buffers are borrowed without copying or hashing again.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The helper retains no buffer references.
 */
export function firstDifference(before: Buffer, after: Buffer): number {
  const length: number = Math.min(before.length, after.length);
  for (let index: number = 0; index < length; index += 1)
    if (before[index] !== after[index]) return index;
  return length;
}
