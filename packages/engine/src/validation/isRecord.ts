/**
 * Narrow unknown input to a non-null object that is not an array.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Narrow unknown input to a non-null object that is not an array.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This small structural guard lets artifact validators safely inspect fields.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Class instances, maps and dates can satisfy this guard; it does not prove a plain JSON record or schema.
 * @evidence contracts/development/common.md#meaningful-documentation The predicate's scope is object field access, not serializability or deep validity.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three shallow checks use constant work and no collection allocation.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Artifact gates share the same shape boundary without identity caching.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The borrowed object is returned only through narrowing; no reference is retained internally.
 */
export const isRecord: (value: unknown) => value is Record<string, unknown> = (
  value: unknown,
): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
