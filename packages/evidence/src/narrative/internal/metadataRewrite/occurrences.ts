import { occurrenceOffsets } from "./occurrenceOffsets";

/**
 * Counts literal non-overlapping occurrences of a required nonempty token.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Count the nonoverlapping positions returned by occurrenceOffsets, which requires a nonempty token.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The count adapter shares occurrence semantics with diagnostic position lookup.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No normalization or special count changes the literal scan.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states literal nonoverlap; the nonempty-token premise is inherited.
 * @evidence contracts/development/implementation.md#efficient-algorithms Delegation scans text and allocates K offsets before reading length; this existing O(K) allocation remains.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Counts and positions share one implementation; distinct strings still require separate scans.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The temporary offset array becomes unreachable after length is read; only a number returns.
 */
export function occurrences(text: string, token: string): number {
  return occurrenceOffsets(text, token).length;
}
