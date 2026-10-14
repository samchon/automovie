import type { IAutoMovieSourceIdentityVerification } from "./IAutoMovieSourceIdentityVerification";
import type { IAutoMovieSourceIdentity } from "./IAutoMovieSourceIdentity";
import { normalizeAutoMovieSourceIdentity } from "./normalizeAutoMovieSourceIdentity";
import { AUTOMOVIE_SOURCE_NORMALIZATION_PROTOCOL } from "./AUTOMOVIE_SOURCE_NORMALIZATION_PROTOCOL";
import { AUTOMOVIE_LEGACY_SOURCE_NORMALIZATION_PROTOCOL } from "./AUTOMOVIE_LEGACY_SOURCE_NORMALIZATION_PROTOCOL";
import { digestAutoMovieBytes } from "./digestAutoMovieBytes";
import { legacyNormalizeAutoMovieSource } from "./legacyNormalizeAutoMovieSource";

/**
 * Verify an explicitly versioned source identity from its recoverable bytes.
 *
 * @evidence contracts/common.md#principled-implementation Recoverable bytes are normalized under v2 before digest comparison; a declared v1 identity is rederived with its exact lossy predecessor before migration.
 * @evidence contracts/common.md#clear-and-simple-design A closed status union distinguishes current, migrated, stale and unverifiable instead of treating absence as staleness.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent bytes are refused before decoding, but an unknown protocol is classified only after current normalization succeeds. Strict v2 decoding precedes legacy verification, so malformed legacy bytes cannot acquire a current identity; caller-owned bytes must remain stable across both passes, with no copy or seal enforcing that premise.
 * @evidence contracts/common.md#meaningful-documentation States status payloads, original-byte ownership and verification order. Only current normalization is caught and converted with String(error); that conversion can fail, and predecessor normalization/hash failures propagate rather than returning a status.
 * @evidence contracts/performance.md#efficient-algorithms Current verification costs O(B); legacy verification adds one predecessor normalization/hash pass and proportional temporary bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work The already derived current record is returned for current or migrated outcomes; no cross-request digest cache replaces the supplied bytes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned current records transfer their normalized buffer; stale/unverifiable paths retain no bytes after completion.
 */
export const verifyAutoMovieSourceIdentity: (props: {

    /**
     * Source-relative pathname named by strict-decoding refusals.
     */
    path: string;

    /**
     * Original source bytes; a bare semantic digest cannot be migrated safely.
     */
    bytes?: Uint8Array;

    /**
     * Protocol declared by the persisted semantic identity.
     */
    protocol: string;

    /**
     * Semantic digest produced under that protocol.
     */
    digest: string;
}) => IAutoMovieSourceIdentityVerification = (props: {

    /**
     * Source-relative pathname named by strict-decoding refusals.
     */
    path: string;

    /**
     * Original source bytes; a bare semantic digest cannot be migrated safely.
     */
    bytes?: Uint8Array;

    /**
     * Protocol declared by the persisted semantic identity.
     */
    protocol: string;

    /**
     * Semantic digest produced under that protocol.
     */
    digest: string;
}): IAutoMovieSourceIdentityVerification => {
    if (props.bytes === undefined)
        return {
            status: "unverifiable",
            reason: "Original source bytes are required to verify source identity.",
        };
    let current: IAutoMovieSourceIdentity;
    try {
        current = normalizeAutoMovieSourceIdentity({
            path: props.path,
            bytes: props.bytes,
        });
    }
    catch (error) {
        return { status: "unverifiable", reason: String(error) };
    }
    if (props.protocol === AUTOMOVIE_SOURCE_NORMALIZATION_PROTOCOL)
        return current.semanticDigest === props.digest
            ? { status: "current", current }
            : { status: "stale" };
    if (props.protocol === AUTOMOVIE_LEGACY_SOURCE_NORMALIZATION_PROTOCOL) {
        const legacyDigest: string = digestAutoMovieBytes(legacyNormalizeAutoMovieSource(props.bytes));
        if (legacyDigest !== props.digest)
            return { status: "stale" };
        return { status: "migrated", legacyDigest, current };
    }
    return {
        status: "unverifiable",
        reason: `Unknown source normalization protocol ${JSON.stringify(props.protocol)}.`,
    };
};
