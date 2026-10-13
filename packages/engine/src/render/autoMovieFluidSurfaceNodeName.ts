/** Name of the viewer object drawing one fluid domain's free surface.
 *
 * @evidence contracts/common.md#principled-implementation Prefix the unchanged domain id with water: to join a fluid free-surface viewer object to its semantic-mask claim; the domain id is admitted by compiled design validation.
 * @evidence contracts/common.md#clear-and-simple-design One cross-package naming contract prevents engine mask derivation from importing the viewer or independently guessing object names.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The prefix denotes actual fluid surface objects; no domain or consumer gets a fixture alias.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies the viewer object role and preserves the exact domain spelling; the name is not a file path.
 * @evidence contracts/performance.md#efficient-algorithms Concatenation takes O(L) time/output for domain-id length L and performs no domain lookup.
 * @evidence contracts/performance.md#reuse-equivalent-work Surface producer and mask consumer share the naming law; no mutable object or allocation result is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the immutable name transfers to the caller; no fluid state or renderer resource is retained.
 */
export const autoMovieFluidSurfaceNodeName: (domain: string) => string = (domain: string): string =>
  `water:${domain}`;
