/**
 * Read the complete non-empty beat suffix of shot:<beat>, or return null.
 *
 * Commit preconditions refuse null; legacy resident keying may explicitly keep the original id when the convention does not apply.
 *
 * @evidence contracts/common.md#principled-implementation Exact prefix admission and a non-empty suffix parse the resident grammar without altering the suffix's colon characters or other beat data.
 * @evidence contracts/common.md#clear-and-simple-design The parser owns the grammar and each caller owns refusal or its documented legacy keying policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid prefixes and empty suffixes produce null instead of an invented beat; the legacy fallback remains explicit at its caller.
 * @evidence contracts/common.md#meaningful-documentation States complete-suffix parsing, invalid outcomes and admission versus legacy keying consumers.
 * @evidence contracts/performance.md#efficient-algorithms A fixed-prefix check and suffix allocation take time and output space proportional to id length.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Parsing starts no repeated operation or cross-call cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A string or null transfers to the caller without retaining the input or acquiring resources.
 */
export function beatOf(shotId: string): string | null {
  if (!shotId.startsWith("shot:")) return null;
  const beat: string = shotId.slice("shot:".length);
  return beat.length === 0 ? null : beat;
}
