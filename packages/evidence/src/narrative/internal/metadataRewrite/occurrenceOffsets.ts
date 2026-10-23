/**
 * Locates literal non-overlapping occurrences of a required nonempty token.
 *
 * @evidence contracts/common.md#principled-implementation Repeated indexOf advances by token length and returns literal nonoverlapping positions; the token must be nonempty.
 * @evidence contracts/common.md#clear-and-simple-design Ordered positions serve both counts and candidate alarm locations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Literal matching avoids regex reinterpretation; an empty token would prevent progress and is unsupported.
 * @evidence contracts/common.md#meaningful-documentation The comment states nonoverlap; callers use fixed nonempty corruption signals.
 * @evidence contracts/performance.md#efficient-algorithms Successive searches use the runtime string-search primitive and allocate O(K) positions for K matches.
 * @evidence contracts/performance.md#reuse-equivalent-work The returned candidate positions support both counting and identifying the first added match.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned caller-owned array grows with matches; no cross-call state persists.
 */
export function occurrenceOffsets(text: string, token: string): number[] {
  const offsets: number[] = [];
  for (let offset: number = 0; ; ) {
    const found: number = text.indexOf(token, offset);
    if (found === -1) return offsets;
    offsets.push(found);
    offset = found + token.length;
  }
}
