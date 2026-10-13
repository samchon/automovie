import { AUTOMOVIE_CANONICAL_JSON_PROTOCOL } from "./AUTOMOVIE_CANONICAL_JSON_PROTOCOL";

/**
 * Versioned identity of one admitted structured value.
 *
 * @evidence contracts/common.md#principled-implementation Current protocol, canonical valid JSON bytes and their SHA-256 digest form one recoverable structured-value identity.
 * @evidence contracts/common.md#clear-and-simple-design The canonical identity producer and verifier share this byte record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The type does not validate protocol or digest truth and its Uint8Array remains mutable after production.
 * @evidence contracts/common.md#meaningful-documentation Documents byte ownership and digest meaning without a freeze or collision certificate.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased canonical-byte record runs no encoding; identifyAutoMovieCanonicalJson owns engine admission, UTF-8 encoding and SHA-256.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A digest field coordinates no cache; its producer reuses the newly encoded byte buffer for hashing and return within one call.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no bytes; the identity producer transfers a mutable canonical buffer and digest to its caller.
 * @author Samchon
 */
export interface IAutoMovieCanonicalJsonIdentity {

    /**
     * Algorithm that produced the canonical bytes.
     */
    protocol: typeof AUTOMOVIE_CANONICAL_JSON_PROTOCOL;

    /**
     * Canonical valid JSON bytes.
     */
    bytes: Uint8Array;

    /**
     * SHA-256 of {@link bytes}.
     */
    digest: string;
}
