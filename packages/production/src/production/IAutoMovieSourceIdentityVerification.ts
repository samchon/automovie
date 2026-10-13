import type { IAutoMovieSourceIdentity } from "./IAutoMovieSourceIdentity";

/**
 * Outcome of verifying and, when possible, migrating a source identity.
 *
 * @evidence contracts/common.md#principled-implementation The status discriminant makes a current record available only for current or migrated outcomes; migration also preserves the matched legacy digest.
 * @evidence contracts/common.md#clear-and-simple-design Source verification reports stale separately from absent bytes, unsupported protocol or strict-decoding failure.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A status record is the producer's observation, not a runtime immutable lease over source bytes.
 * @evidence contracts/common.md#meaningful-documentation Documents status-specific payloads and why unverifiable has explanation text.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased status union runs no verification; verifyAutoMovieSourceIdentity owns current and predecessor normalization/hash costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Status arms coordinate no reuse; the verifier derives current bytes for the supplied attempt and returns them only when current or migrated.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The union retains nothing; callers own returned current buffers and explanation strings from the verifier.
 * @author Samchon
 */
export type IAutoMovieSourceIdentityVerification = {

    /**
     * Verification outcome discriminant controlling which identity payload is available.
     */
    status: "current";

    /**
     * Newly derived current identity, including its caller-owned canonical or normalized byte buffer.
     */
    current: IAutoMovieSourceIdentity;
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
    current: IAutoMovieSourceIdentity;
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
