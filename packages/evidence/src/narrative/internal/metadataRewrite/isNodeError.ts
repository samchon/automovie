/**
 * Narrows an unknown error to an Error with an optional Node errno code.
 *
 * @evidence contracts/common.md#principled-implementation Use instanceof Error before callers inspect an optional Node errno code.
 * @evidence contracts/common.md#clear-and-simple-design One predicate centralizes the Error-instance premise.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No code is synthesized; protectedFileKind still explicitly compares ENOENT.
 * @evidence contracts/common.md#meaningful-documentation The comment names Node error narrowing; code presence is not guaranteed.
 * @evidence contracts/performance.md#efficient-algorithms One instanceof check takes constant time and auxiliary space.
 * @evidence contracts/performance.md#reuse-equivalent-work Each caught value is checked independently without caching errors.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No error reference is retained.
 */
export function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error;
}
