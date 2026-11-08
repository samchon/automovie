/**
 * Compiler-owned runtime identity for one project model group.
 *
 *
 * @evidence contracts/development/implementation.md#principled-implementation Prefix the unchanged model group id with automovie:model: so every identical group reference addresses the same production runtime model and different identifiers remain distinct.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One naming owner is shared by population tiers and production model materialization without a registry or host-specific rewrite.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The prefix is the production namespace contract; embedded punctuation is preserved and no consumer or fixture id receives an alias.
 * @evidence contracts/development/common.md#meaningful-documentation Docs give the runtime namespace and exact preservation of the caller-admitted model group id rather than promising filename safety.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constructing the string costs O(L) bytes for an L-character model group id, with no inventory lookup.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Every producer uses the same deterministic naming function; string values need no retained cache or invalidation scheme.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the returned immutable string escapes; no registry, path handle or task is acquired.
 */
export const productionRuntimeModelId: (model: string) => string = (
  model: string,
): string => `automovie:model:${model}`;
