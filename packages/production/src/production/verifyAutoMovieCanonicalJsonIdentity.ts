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
 * @evidence contracts/common.md#prohibited-implementation-shortcuts undefined means no recoverable root and unknown protocols are not guessed. Legacy migration requires stable values across its v2 and v1 passes; no clone/freeze enforces that premise, and mutable Proxy observations can differ. String(error) inside catch can itself throw for an arbitrary nonconvertible failure instead of returning unverifiable.
 * @evidence contracts/common.md#meaningful-documentation Documents original-value ownership, outcome payloads and legacy digest authentication; source stability across passes remains the caller's obligation and error-description failure can escape the status union.
 * @evidence contracts/performance.md#efficient-algorithms Current verification includes canonical traversal/sorting and hashing; v1 adds a full predecessor encoding/hash with proportional text/byte storage.
 * @evidence contracts/performance.md#reuse-equivalent-work A derived current identity is reused in the migrated result; no cache over mutable object graphs is introduced.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Current/migrated records transfer their buffers; encoding state is temporary and the catch attempts to transfer explanation text, with description failure still able to escape. Expanded canonical/legacy text and bytes have no local cap, and no handle or task is acquired.
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
