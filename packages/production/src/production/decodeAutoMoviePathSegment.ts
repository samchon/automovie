

/**
 * Decode a segment produced by {@link encodeAutoMoviePathSegment}.
 *
 * @evidence contracts/common.md#principled-implementation Ordinary segments use decodeURIComponent; the explicit ~sha256- domain throws because its identifier must be recovered from persisted content.
 * @evidence contracts/common.md#clear-and-simple-design This inverse serves short segments outside the reserved ~sha256- spelling; the owning record handles hashed and literal-reserved id recovery.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A hashed digest is not treated as reversible text, and malformed percent encodings keep the native URIError.
 * @evidence contracts/common.md#meaningful-documentation States the hashed-domain refusal and native percent-decoding failure without authenticating an arbitrary pathname.
 * @evidence contracts/performance.md#efficient-algorithms Prefix inspection and percent decoding take O(L) time and output storage.
 * @evidence contracts/performance.md#reuse-equivalent-work One supplied segment is decoded directly; retaining a decoding table would add state without avoiding the owning record read for hashed ids.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only decoded text or an error escapes; no original content, handle or task is retained.
 */
export const decodeAutoMoviePathSegment: (value: string) => string = (value: string): string => value.startsWith("~sha256-")
    ? (() : never => {
        throw new Error("Hashed path segments are decoded from file content.");
    })()
    : decodeURIComponent(value);
