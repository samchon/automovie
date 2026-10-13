

/**
 * Object failures with a message member use String(message); other values use String(error).
 *
 * @evidence contracts/common.md#principled-implementation Object failures with a message member use String(message); other values use String(error).
 * @evidence contracts/common.md#clear-and-simple-design Generation and inspection share explanation extraction while their owners preserve typed category and cause.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts String conversion or a message getter can itself throw for arbitrary custom failures; no safe serialization guarantee is claimed.
 * @evidence contracts/common.md#meaningful-documentation States arbitrary-failure conversion rather than requiring an Error instance.
 * @evidence contracts/performance.md#efficient-algorithms Member access and String conversion costs depend on the supplied value's conversion behavior; no bound exists for user-defined conversion.
 * @evidence contracts/performance.md#reuse-equivalent-work Each current failure is formatted directly, with no retained explanation cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only text or a conversion failure escapes; this helper acquires no handle and retains no original error after return.
 */
export const derivedArtifactErrorMessage: (error: unknown) => string = (error: unknown): string => typeof error === "object" && error !== null && "message" in error
    ? String(error.message)
    : String(error);
