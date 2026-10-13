import { isAutoMovieWebVttIdentifier } from "./isAutoMovieWebVttIdentifier";

/**
 * Return one WebVTT header text or cue identifier verbatim, or throw.
 *
 * WebVTT defines no character references for these lines, so escaping would
 * change the identity a player reads; a value `isAutoMovieWebVttIdentifier`
 * refuses (empty, containing CR or LF, or containing `-->`) throws an `Error`
 * instead of being rewritten.
 *
 * @evidence contracts/common.md#principled-implementation Preserving the value and refusing what the grammar cannot carry is the only reversible choice, because any substitution would publish a different id than the timeline holds.
 * @evidence contracts/common.md#clear-and-simple-design The rule lives in `isAutoMovieWebVttIdentifier`; this function is the throwing form `canonicalProductionWebVtt` needs, while film assembly uses the predicate to report a diagnostic.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It never trims, replaces or escapes a malformed id to make serialization succeed; the throw surfaces the invalid input.
 * @evidence contracts/common.md#meaningful-documentation The doc states that the value is preserved verbatim, why it is not escaped, which values are refused, and that refusal throws.
 * @evidence contracts/performance.md#efficient-algorithms The cost is the predicate's single O(L) scan, and the input string is returned without copying.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Validating one string coordinates no phases and leaves nothing a later call could reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No state, handle or task outlives the call; the returned value is the caller's own string.
 */
export const serializeAutoMovieWebVttIdentifier = (value: string): string => {
  if (isAutoMovieWebVttIdentifier(value) === false)
    throw new Error(
      "WebVTT header and cue identifiers must be non-empty and must not contain a line break or -->.",
    );
  return value;
};
