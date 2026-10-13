import { createHash } from "node:crypto";

/**
 * Encode one persisted identifier as a portable filename segment. Short segments outside the reserved ~sha256- spelling can be decoded through decodeAutoMoviePathSegment; an encoding over 180 UTF-8 bytes becomes a content-addressed hash segment whose original identifier must be recovered from persisted content. RFC 3986 tail escapes, dot aliases and Windows device-name escapes preserve the supported filesystem namespace.
 *
 * @evidence contracts/common.md#principled-implementation URI encoding plus RFC 3986 tail, trailing-dot and Windows device escapes yields portable segments; encodings over 180 UTF-8 bytes use a SHA-256 segment.
 * @evidence contracts/common.md#clear-and-simple-design Persisted artifact readers and writers share this encoding instead of maintaining platform-specific filename rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reserved devices and dot aliases are supported differences; a literal short id beginning ~sha256- is also refused by the decoder's reserved domain, and long-id hashes are neither reversible nor a collision certificate.
 * @evidence contracts/common.md#meaningful-documentation Documents the 180-byte cutoff, short-segment decoding and the need for file content to recover a hashed identifier; lone surrogates can throw URIError.
 * @evidence contracts/performance.md#efficient-algorithms Encoding and hazard checks cost O(L) text work/storage; long ids add SHA-256 over their UTF-8 bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work All path consumers use the same encoder; repeated values are recomputed because no retained path table is owned here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned string and any original-id metadata; temporary encodings/hash state expire on return or throw.
 */
export const encodeAutoMoviePathSegment: (value: string) => string = (value: string): string => {
    let encoded: string = encodeURIComponent(value).replace(/[!'()*]/g, (character: string) : string => `%${character.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`);
    // Windows strips trailing dots from path components, while "." and ".."
    // retain traversal meaning on every supported filesystem. Percent-escape
    // those spellings so two logical ids never resolve to one physical leaf.
    if (encoded === "." || encoded === ".." || encoded.endsWith("."))
        encoded = `${encoded.slice(0, -1)}%2E`;
    if (/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9]|conin\$|conout\$)(?:\.|$)/i.test(encoded))
        encoded = `%${encoded
            .charCodeAt(0)
            .toString(16)
            .toUpperCase()
            .padStart(2, "0")}${encoded.slice(1)}`;
    if (Buffer.byteLength(encoded, "utf8") > 180)
        encoded = `~sha256-${createHash("sha256")
            .update(Buffer.from(value, "utf8"))
            .digest("hex")}`;
    return encoded;
};
