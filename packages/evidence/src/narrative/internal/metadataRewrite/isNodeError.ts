/**
 * Narrows an unknown error to an Error with an optional Node errno code.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Use instanceof Error before callers inspect an optional Node errno code.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One predicate centralizes the Error-instance premise.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No code is synthesized; protectedFileKind still explicitly compares ENOENT.
 * @evidence contracts/development/common.md#meaningful-documentation The comment names Node error narrowing; code presence is not guaranteed.
 * @evidence contracts/development/implementation.md#efficient-algorithms One instanceof check takes constant time and auxiliary space.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each caught value is checked independently without caching errors.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources No error reference is retained.
 */
export function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error;
}
