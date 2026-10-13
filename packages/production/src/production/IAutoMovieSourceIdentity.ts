import { AUTOMOVIE_SOURCE_NORMALIZATION_PROTOCOL } from "./AUTOMOVIE_SOURCE_NORMALIZATION_PROTOCOL";

/**
 * Versioned source identity keeps exact bytes apart from permitted equivalence.
 *
 * @evidence contracts/common.md#principled-implementation Protocol, raw digest and normalized-buffer semantic digest keep exact-byte identity distinct from permitted BOM/EOL equivalence.
 * @evidence contracts/common.md#clear-and-simple-design normalizeAutoMovieSourceIdentity produces this record for verification and persisted input identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The type neither authenticates digests nor freezes the mutable returned byte array; stable contents are a caller premise.
 * @evidence contracts/common.md#meaningful-documentation Documents current protocol, exact versus normalized hashes and caller-owned normalized bytes.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased raw-versus-normalized record selects no algorithm; normalizeAutoMovieSourceIdentity owns strict decoding and both SHA-256 passes.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record coordinates no requests; its producer reuses normalized bytes within one call without retaining a mutable-input cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no buffer; the identity producer transfers normalized bytes to the caller, whose retention and mutation determine their lifetime.
 * @author Samchon
 */
export interface IAutoMovieSourceIdentity {

    /**
     * Algorithm that produced the semantic representation.
     */
    protocol: typeof AUTOMOVIE_SOURCE_NORMALIZATION_PROTOCOL;

    /**
     * SHA-256 of the exact input bytes, including BOM and EOL spelling.
     */
    rawDigest: string;

    /**
     * Strictly decoded bytes after the declared BOM/EOL normalization.
     */
    normalized: Uint8Array;

    /**
     * SHA-256 of {@link normalized}.
     */
    semanticDigest: string;
}
