/**
 * Compiler-owned runtime identity for one project model recipe.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Prefix the unchanged recipe identifier with automovie:model: so every identical recipe reference addresses the same production runtime model and different identifiers remain distinct.
 * @evidence contracts/common.md#clear-and-simple-design One naming owner is shared by population tiers and production model materialization without a registry or host-specific rewrite.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The prefix is the production namespace contract; embedded punctuation is preserved and no consumer or fixture id receives an alias.
 * @evidence contracts/common.md#meaningful-documentation Docs give the runtime namespace and exact preservation of the caller-admitted recipe id rather than promising filename safety.
 * @evidence contracts/performance.md#efficient-algorithms Constructing the string costs O(L) bytes for an L-character recipe identifier, with no inventory lookup.
 * @evidence contracts/performance.md#reuse-equivalent-work Every producer uses the same deterministic naming function; string values need no retained cache or invalidation scheme.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned immutable string escapes; no registry, path handle or task is acquired.
 */
export const productionRuntimeModelId: (recipe: string) => string = (recipe: string): string =>
  `automovie:model:${recipe}`;
