/**
 * Append slash to a placement id for scene lowering, profile binding, actor clips and articulated-object channels. This is the shared literal naming law; concrete graph admission still owns uniqueness.
 *
 * @evidence contracts/common.md#principled-implementation Append slash to a placement id, the existing law shared by scene lowering, profile binding, actor clips and articulated-object channels.
 * @evidence contracts/common.md#clear-and-simple-design One prefix owner aligns those producers without another naming abstraction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No fixture prefix or hidden escaping is used; slash-containing tuples can collide and admitted graphs must have unique ids.
 * @evidence contracts/common.md#meaningful-documentation Docs identify the literal spelling and all naming consumers, leaving uniqueness to graph admission.
 * @evidence contracts/performance.md#efficient-algorithms S id characters need O(S) result storage with no scene lookup.
 * @evidence contracts/performance.md#reuse-equivalent-work Child and lowering helpers share the same function, without retaining results over mutable placement identities.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the prefix string escapes; no registry, native handle or running task is retained.
 */
export const placementNodePrefix: (placement: string) => string = (placement: string): string =>
  `${placement}/`;
