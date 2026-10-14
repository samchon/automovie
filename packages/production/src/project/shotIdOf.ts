/**
 * Derive the one resident shot identity owned by an admitted beat id.
 *
 * @evidence contracts/common.md#principled-implementation The resident contract prefixes the complete beat id with shot:, preserving its data without splitting or normalization.
 * @evidence contracts/common.md#clear-and-simple-design Storage and commit preconditions share one constructor; beat admission stays with their gates.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No beat id changes this mapping and physical filename escaping never changes the logical identity.
 * @evidence contracts/common.md#meaningful-documentation States the admitted-input premise and one-shot-per-beat ownership.
 * @evidence contracts/performance.md#efficient-algorithms One string construction uses time and output space proportional to beat id length.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The constructor starts no repeated work and caches no identity.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only the returned string transfers to the caller; no input or resource is retained.
 */
export function shotIdOf(beat: string): string {
  return `shot:${beat}`;
}
