/**
 * Compiler-owned skeleton identity for one rigged project model group.
 *
 *
 * @evidence contracts/development/implementation.md#principled-implementation Prefix the unchanged model group id with automovie:skeleton: so a rigged production model addresses its compiler-owned skeleton without conflating it with the model namespace.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One naming function shares the exact namespace between production materialization and runtime profile binding.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The namespace is explicit product policy; punctuation is preserved and no model or fixture receives a special alias.
 * @evidence contracts/development/common.md#meaningful-documentation The comment identifies compiler ownership and model group identity; the result is an identifier rather than a filesystem path.
 * @evidence contracts/development/implementation.md#efficient-algorithms One concatenation takes O(L) time and output bytes for an L-character model group id, without inventory lookup.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work All callers reuse the naming law; immutable equal strings require no retained cache or invalidation state.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the returned string survives, with no skeleton, registry or resource handle retained.
 */
export const productionRuntimeSkeletonId: (model: string) => string = (
  model: string,
): string => `automovie:skeleton:${model}`;
