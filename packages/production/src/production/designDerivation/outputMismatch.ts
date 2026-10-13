/**
 * Find the first sorted output-set or complete-byte difference.
 *
 * @evidence contracts/common.md#principled-implementation Compares population length, each aligned target/path and full Buffer byte equality, returning set or the first differing target.
 * @evidence contracts/common.md#clear-and-simple-design Runs after canonical target sorting so aligned indices refer to the same deterministic comparison order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses actual bytes rather than a digest collision assumption; typed already-normalized output populations remain its premise.
 * @evidence contracts/common.md#meaningful-documentation Documents null equality and the set/quoted-target mismatch result consumed by candidate refusal.
 * @evidence contracts/performance.md#efficient-algorithms Visits aligned outputs until the first mismatch and copies compared byte views into Buffers; worst-case work/storage includes all compared bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work No comparison result cache exists, and a later evaluation's buffers are compared independently.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary comparison Buffers leave each iteration/call; only a mismatch string escapes and no original output ownership transfers.
 */
export function outputMismatch(
  left: readonly { target: string; recordPath: string; bytes: Uint8Array }[],
  right: readonly { target: string; recordPath: string; bytes: Uint8Array }[],
): string | null {
  if (left.length !== right.length) return "set";
  for (let index: number = 0; index < left.length; ++index) {
    const first: { target: string; recordPath: string; bytes: Uint8Array } = left[index]!;
    const second: { target: string; recordPath: string; bytes: Uint8Array } = right[index]!;
    if (
      first.target !== second.target ||
      first.recordPath !== second.recordPath ||
      Buffer.from(first.bytes).equals(Buffer.from(second.bytes)) === false
    )
      return `"${first.target}"`;
  }
  return null;
}
