/**
 * Locates literal non-overlapping occurrences of a required nonempty token.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Repeated indexOf advances by token length and returns literal nonoverlapping positions; the token must be nonempty.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Ordered positions serve both counts and candidate alarm locations.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Literal matching avoids regex reinterpretation; an empty token would prevent progress and is unsupported.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states nonoverlap; callers use fixed nonempty corruption signals.
 * @evidence contracts/development/implementation.md#efficient-algorithms Successive searches use the runtime string-search primitive and allocate O(K) positions for K matches.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The returned candidate positions support both counting and identifying the first added match.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned caller-owned array grows with matches; no cross-call state persists.
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
