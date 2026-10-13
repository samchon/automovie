import type { IAutoMovieCanonicalJsonVerification } from "./IAutoMovieCanonicalJsonVerification";
import { AUTOMOVIE_CANONICAL_JSON_PROTOCOL } from "./AUTOMOVIE_CANONICAL_JSON_PROTOCOL";
import type { IAutoMovieCanonicalJsonIdentity } from "./IAutoMovieCanonicalJsonIdentity";
import { identifyAutoMovieCanonicalJson } from "./identifyAutoMovieCanonicalJson";
import { AUTOMOVIE_LEGACY_CANONICAL_JSON_PROTOCOL } from "./AUTOMOVIE_LEGACY_CANONICAL_JSON_PROTOCOL";
import { legacyCanonicalizeJson } from "./legacyCanonicalizeJson";
import { digestAutoMovieBytes } from "./digestAutoMovieBytes";

/**
 * Verify an explicitly versioned JSON identity and rederive the current one.
 *
 * @evidence contracts/common.md#principled-implementation Current values are admitted and hashed under v2; v1 values first pass v2 admission and then use the predecessor spelling to authenticate migration.
 * @evidence contracts/common.md#clear-and-simple-design Status arms distinguish absence, unknown protocol, stale digest and a recoverable current identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts undefined means no recoverable root; unknown protocols are not guessed, and legacy encoding cannot bypass current domain refusal.
 * @evidence contracts/common.md#meaningful-documentation Documents which outcomes include current bytes and that original values, rather than bare digests, are required.
 * @evidence contracts/performance.md#efficient-algorithms Current verification includes canonical traversal/sorting and hashing; v1 adds a full predecessor encoding/hash with proportional text/byte storage.
 * @evidence contracts/performance.md#reuse-equivalent-work A derived current identity is reused in the migrated result; no cache over mutable object graphs is introduced.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Current/migrated records transfer their buffers; caught refusals return explanation strings and release temporary encoding state.
 */
export const verifyAutoMovieCanonicalJsonIdentity: (props: {

    /**
     * Original structured value; a bare digest cannot be migrated safely.
     */
    value?: unknown;

    /**
     * Protocol declared by the persisted identity.
     */
    protocol: string;

    /**
     * Digest produced under that protocol.
     */
    digest: string;
}) => IAutoMovieCanonicalJsonVerification = (props: {

    /**
     * Original structured value; a bare digest cannot be migrated safely.
     */
    value?: unknown;

    /**
     * Protocol declared by the persisted identity.
     */
    protocol: string;

    /**
     * Digest produced under that protocol.
     */
    digest: string;
}): IAutoMovieCanonicalJsonVerification => {
    if (props.value === undefined)
        return {
            status: "unverifiable",
            reason: "Original structured value is required to verify canonical JSON.",
        };
    if (props.protocol === AUTOMOVIE_CANONICAL_JSON_PROTOCOL) {
        let current: IAutoMovieCanonicalJsonIdentity;
        try {
            current = identifyAutoMovieCanonicalJson(props.value);
        }
        catch (error) {
            return { status: "unverifiable", reason: String(error) };
        }
        return current.digest === props.digest
            ? { status: "current", current }
            : { status: "stale" };
    }
    if (props.protocol === AUTOMOVIE_LEGACY_CANONICAL_JSON_PROTOCOL) {
        let current: IAutoMovieCanonicalJsonIdentity;
        let legacy: Uint8Array;
        try {
            current = identifyAutoMovieCanonicalJson(props.value);
            legacy = Buffer.from(legacyCanonicalizeJson(props.value), "utf8");
        }
        catch (error) {
            return { status: "unverifiable", reason: String(error) };
        }
        if (digestAutoMovieBytes(legacy) !== props.digest)
            return { status: "stale" };
        return {
            status: "migrated",
            legacyDigest: props.digest,
            current,
        };
    }
    return {
        status: "unverifiable",
        reason: `Unknown canonical JSON protocol ${JSON.stringify(props.protocol)}.`,
    };
};
