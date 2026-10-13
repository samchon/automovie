

/**
 * RFC 6901 escaping for diagnostic object locations.
 *
 * @evidence contracts/common.md#principled-implementation RFC 6901 escapes ~ before /, preserving unambiguous object-member pointer components.
 * @evidence contracts/common.md#clear-and-simple-design Object grammar composes containing pointers with this string-only owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No Unicode normalization or member-name conflation is introduced.
 * @evidence contracts/common.md#meaningful-documentation States exact ~0 and ~1 encoding order and fresh string output.
 * @evidence contracts/performance.md#efficient-algorithms Two replacements scan L name units and allocate proportional escaped text.
 * @evidence contracts/performance.md#reuse-equivalent-work The pointer component is computed from the current decoded member without a retained name cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only escaped text transfers to the parser; no handle or original-name store is retained.
 */
export const escapeAutoMovieJsonPointer: (value: string) => string = (value: string): string => value.replace(/~/g, "~0").replace(/\//g, "~1");
