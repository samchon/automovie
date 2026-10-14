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
     * Current-protocol bytes matched the supplied digest.
     */
    status: "current";

    /**
     * Newly derived current identity with its caller-owned mutable canonical byte buffer.
     */
    current: IAutoMovieCanonicalJsonIdentity;
} | {

    /**
     * The predecessor digest matched and current identity bytes are available for migration.
     */
    status: "migrated";

    /**
     * The matched predecessor digest authenticated before returning current migration bytes.
     */
    legacyDigest: string;

    /**
     * Newly derived current identity; the verifier requires the value to remain stable across both encoding passes.
     */
    current: IAutoMovieCanonicalJsonIdentity;
} | {

    /**
     * The supplied digest did not match bytes derived under its recognized protocol.
     */
    status: "stale";
} | {

    /**
     * Missing original value, unknown protocol or a describable encoding refusal prevented verification.
     */
    status: "unverifiable";

    /**
     * Explanation for absent input, unknown protocol or a caught current/legacy encoding failure whose string conversion succeeded.
     */
    reason: string;
};
