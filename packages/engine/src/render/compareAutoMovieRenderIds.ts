/**
 * Compare two strings by UTF-16 code unit.
 *
 * Relational comparison uses the same code-unit order as the native default
 * string sort, without locale collation. This named comparator also applies
 * that order to ids extracted from records on every host.
 *
 * @evidence contracts/common.md#principled-implementation Relational string comparisons establish UTF-16 code-unit order with -1/0/1 results, matching native default string sorting while avoiding locale collation for extracted record ids.
 * @evidence contracts/common.md#clear-and-simple-design A named comparator centralizes deterministic ordering for assets, semantic claims, ownership and render diagnostics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts All ids use the same comparison, including punctuation and Unicode; no host locale, fixture or expected order selects a different rule.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies code-unit ordering and distinguishes this record comparator from locale-aware collation.
 * @evidence contracts/performance.md#efficient-algorithms Comparing two strings costs up to their common-prefix length and allocates no collection; sorting owners include that cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Every render ordering consumer shares this comparison law; immutable strings require no retained memoization.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a number returns, with no id population, locale object, handle or task retained.
 */
export const compareAutoMovieRenderIds: (left: string, right: string) => number = (
  left: string,
  right: string,
): number => (left < right ? -1 : left > right ? 1 : 0);
