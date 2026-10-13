import type { AutoMovieDerivedArtifactGenerationErrorCode } from "./AutoMovieDerivedArtifactGenerationErrorCode";

/**
 * Structured refusal from one explicit precomputation attempt.
 *
 * @evidence contracts/common.md#principled-implementation A native Error preserves a closed generation category, explanation and optional cause.
 * @evidence contracts/common.md#clear-and-simple-design Generation and retirement share one typed refusal identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Publication-failed does not guarantee that an earlier output rename was rolled back.
 * @evidence contracts/common.md#meaningful-documentation Documents code/cause ownership and partial-publication meaning.
 * @evidence contracts/performance.md#efficient-algorithms Construction retains message/cause and host stack with no input-byte traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work Each current refusal gets a fresh error; errors are not reused across attempts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The catching caller owns the error and cause; no descriptor or task is acquired by construction.
 */
export class AutoMovieDerivedArtifactGenerationError extends Error {

    /**
     * A native Error preserves a closed generation category, explanation and optional cause. Generation and retirement share one typed refusal identity.
     *
     * Publication-failed does not guarantee that an earlier output rename was rolled back.
     *
     * Documents code/cause ownership and partial-publication meaning.
     *
     * Construction retains message/cause and host stack with no input-byte traversal. Each current refusal gets a fresh error; errors are not reused across attempts.
     *
     * The catching caller owns the error and cause; no descriptor or task is acquired by construction.
     */
    public constructor(

    /**
     * Stable generation refusal classification.
     */
    public readonly code: AutoMovieDerivedArtifactGenerationErrorCode, message: string, options?: ErrorOptions) {
        super(message, options);
    }
}
