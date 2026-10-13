

/**
 * Non-null non-array objects narrow to record access before index field checks.
 *
 * @evidence contracts/common.md#principled-implementation Non-null non-array objects narrow to record access before index field checks.
 * @evidence contracts/common.md#clear-and-simple-design Index root and owners share this preliminary container check.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Prototypes, keys and Proxy behavior are not inspected; actual JSON parser objects are ordinary materialized records.
 * @evidence contracts/common.md#meaningful-documentation States structural narrowing without complete schema or physical admission.
 * @evidence contracts/performance.md#efficient-algorithms Constant container tests use constant additional storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Current values are narrowed directly without a mutable-object verdict cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a boolean escapes and no record or handle is retained.
 */
export const libraryStateIsRecord: (value: unknown) => value is Record<string, unknown> = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && Array.isArray(value) === false;
