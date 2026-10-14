

/**
 *
 * @evidence contracts/common.md#principled-implementation Null/undefined render as none; other keys use the established quoted diagnostic spelling.
 * @evidence contracts/common.md#clear-and-simple-design Owns mismatch explanation rather than key admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Quoted spelling is not JSON escaping or a path-validity certificate.
 * @evidence contracts/common.md#meaningful-documentation States optional-key formatting.
 * @evidence contracts/performance.md#efficient-algorithms Formatting costs proportional key text.
 * @evidence contracts/performance.md#reuse-equivalent-work Formats the current failure once without retained messages.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a string transfers; no input record is retained.
 */
export const autoMovieProjectFormatKey: (key: string | null | undefined) => string = (key: string | null | undefined): string => key === null || key === undefined ? "none" : `"${key}"`;
