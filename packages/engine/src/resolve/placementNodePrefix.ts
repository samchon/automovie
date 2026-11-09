/**
 * Append slash to a placement id for scene lowering, profile binding, actor clips and articulated-object channels. This is the shared literal naming law; concrete graph admission still owns uniqueness.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Append slash to a placement id, the existing law shared by scene lowering, profile binding, actor clips and articulated-object channels.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One prefix owner aligns those producers without another naming abstraction.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No fixture prefix or hidden escaping is used; slash-containing tuples can collide and admitted graphs must have unique ids.
 * @evidence contracts/development/common.md#meaningful-documentation Docs identify the literal spelling and all naming consumers, leaving uniqueness to graph admission.
 * @evidence contracts/development/implementation.md#efficient-algorithms S id characters need O(S) result storage with no scene lookup.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Child and lowering helpers share the same function, without retaining results over mutable placement identities.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the prefix string escapes; no registry, native handle or running task is retained.
 */
export const placementNodePrefix: (placement: string) => string = (
  placement: string,
): string => `${placement}/`;
