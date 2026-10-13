import type { AutoMovieDerivedArtifactGenerationErrorCode } from "./AutoMovieDerivedArtifactGenerationErrorCode";
import { AutoMovieDerivedArtifactGenerationError } from "./AutoMovieDerivedArtifactGenerationError";

/**
 * Throws the generation error class with its requested closed category and explanation.
 *
 * @evidence contracts/common.md#principled-implementation Throws the generation error class with its requested closed category and explanation.
 * @evidence contracts/common.md#clear-and-simple-design Generation path/basis/manifest guards use one never-returning refusal boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No retry or fallback masks the originating category or publishes substitute output.
 * @evidence contracts/common.md#meaningful-documentation States the never result and category/message ownership.
 * @evidence contracts/performance.md#efficient-algorithms Allocating an Error and its host stack dominates a fixed argument count; no input collection is traversed.
 * @evidence contracts/performance.md#reuse-equivalent-work A fresh error captures the current refusal; error instances are not reused across attempts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The thrown object transfers to the caller's error path and retains no handles or tasks.
 */
export const derivedArtifactGenerationFailure: (code: AutoMovieDerivedArtifactGenerationErrorCode, message: string) => never = (code: AutoMovieDerivedArtifactGenerationErrorCode, message: string): never => {
    throw new AutoMovieDerivedArtifactGenerationError(code, message);
};
