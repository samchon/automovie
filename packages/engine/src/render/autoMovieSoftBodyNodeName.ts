/**
 * Name of the viewer object drawing one soft-body panel.
 *
 * Mirrors `buildSoftBodyObject`. The engine cannot import the viewer and the
 * mask has to be derivable without a renderer, so the names both sides agree on
 * live here and are asserted by the test suite, exactly as the standable
 * ground's group name is.
 *
 * @evidence contracts/common.md#principled-implementation Prefix the unchanged soft-domain id with soft: so a viewer panel object and its engine-derived semantic claim join by the same supported name.
 * @evidence contracts/common.md#clear-and-simple-design The engine owns the shared string convention without importing buildSoftBodyObject or renderer classes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The prefix corresponds to an actual panel producer; no fixture or expected color selects a different name.
 * @evidence contracts/common.md#meaningful-documentation Docs identify viewer object naming and the engine/viewer dependency boundary; the result is an exact id rather than a path.
 * @evidence contracts/performance.md#efficient-algorithms One concatenation requires O(L) time/output bytes for domain-id length L and no lattice scan.
 * @evidence contracts/performance.md#reuse-equivalent-work Panel construction and mask derivation reuse the naming law; no geometry or mutable state result is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the immutable name transfers, with no soft simulation state, mesh handle or task retained.
 */
export const autoMovieSoftBodyNodeName: (domain: string) => string = (
  domain: string,
): string => `soft:${domain}`;
