import { occurrenceOffsets } from "./occurrenceOffsets";

/**
 * Counts literal non-overlapping occurrences of a required nonempty token.
 *
 * @evidence contracts/common.md#principled-implementation Count the nonoverlapping positions returned by occurrenceOffsets, which requires a nonempty token.
 * @evidence contracts/common.md#clear-and-simple-design The count adapter shares occurrence semantics with diagnostic position lookup.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No normalization or special count changes the literal scan.
 * @evidence contracts/common.md#meaningful-documentation The comment states literal nonoverlap; the nonempty-token premise is inherited.
 * @evidence contracts/performance.md#efficient-algorithms Delegation scans text and allocates K offsets before reading length; this existing O(K) allocation remains.
 * @evidence contracts/performance.md#reuse-equivalent-work Counts and positions share one implementation; distinct strings still require separate scans.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The temporary offset array becomes unreachable after length is read; only a number returns.
 */
export function occurrences(text: string, token: string): number {
  return occurrenceOffsets(text, token).length;
}
