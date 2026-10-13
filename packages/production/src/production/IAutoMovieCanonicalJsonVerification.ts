import type { IAutoMovieCanonicalJsonIdentity } from "./IAutoMovieCanonicalJsonIdentity";

/**
 * Outcome of verifying and, when possible, migrating an older JSON identity.
 *
 * @evidence contracts/common.md#principled-implementation Status-specific arms distinguish current bytes, authenticated v1 migration, stale identity and unverifiable input.
 * @evidence contracts/common.md#clear-and-simple-design JSON verification returns current bytes only for current/migrated outcomes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The type does not independently authenticate a caller-constructed result or retained bytes.
 * @evidence contracts/common.md#meaningful-documentation Documents current and legacy payload meaning and unverifiable explanation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased verification union selects no algorithm; verifyAutoMovieCanonicalJsonIdentity owns current and legacy canonical encoding/hash work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The union coordinates no requests; its verifier reuses the derived current identity for authenticated migration without a retained object cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type retains no values; the verifier's caller owns returned identity buffers or failure explanation text.
 * @author Samchon
 */
export type IAutoMovieCanonicalJsonVerification = {

    /**
     * Verification outcome discriminant controlling which identity payload is available.
     */
    status: "current";

    /**
     * Newly derived current identity, including its caller-owned canonical or normalized byte buffer.
     */
    current: IAutoMovieCanonicalJsonIdentity;
} | {

    /**
     * Verification outcome discriminant controlling which identity payload is available.
     */
    status: "migrated";

    /**
     * The matched predecessor digest authenticated before returning current migration bytes.
     */
    legacyDigest: string;

    /**
     * Newly derived current identity, including its caller-owned canonical or normalized byte buffer.
     */
    current: IAutoMovieCanonicalJsonIdentity;
} | {

    /**
     * Verification outcome discriminant controlling which identity payload is available.
     */
    status: "stale";
} | {

    /**
     * Verification outcome discriminant controlling which identity payload is available.
     */
    status: "unverifiable";

    /**
     * Explanation for absent recoverable input, unsupported protocol or current admission failure.
     */
    reason: string;
};
