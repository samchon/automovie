import { IAutoMovieProductionRepaintClassifiedFailure } from "./IAutoMovieProductionRepaintClassifiedFailure";
import { repaintExecutionClassifyFailureDisclosure } from "./repaintExecutionClassifyFailureDisclosure";

/**
 * Runs guarded disclosure classification and closes hostile inspection as an internal failure whose retry eligibility still follows the policy with zero charged cost and no available output.
 *
 * @evidence contracts/common.md#principled-implementation Runs guarded disclosure classification and closes hostile inspection as an internal failure whose retry eligibility still follows the policy with zero charged cost and no available output.
 * @evidence contracts/common.md#clear-and-simple-design The outer guard owns hostile-inspection containment; the disclosure helper owns the original failure classification branches.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches use the supplied value and existing protocol/refusal contract; this helper adds no consumer-specific answer, substituted global or foreign-method replacement.
 * @evidence contracts/common.md#meaningful-documentation Only the returned compact failure fact escapes; original provider errors and their buffers are not cached here.
 * @evidence contracts/performance.md#efficient-algorithms The wrapper performs one classification attempt; its fallback does not repeatedly inspect an unsafe object.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This per-call value/disclosure operation does not coordinate completed or in-flight results across requests; its original inputs remain local and its callers own effectful equivalence/currentness.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the returned compact failure fact escapes; original provider errors and their buffers are not cached here.
 */
export const repaintExecutionClassifyFailure: (error: unknown, outerSignal: AbortSignal | undefined) => IAutoMovieProductionRepaintClassifiedFailure = (
  error: unknown,
  outerSignal: AbortSignal | undefined,
): IAutoMovieProductionRepaintClassifiedFailure => {
  try {
    return repaintExecutionClassifyFailureDisclosure(error, outerSignal);
  } catch {
    return {
      failureClass: "internal",
      status: "failed",
      message:
        "Repaint provider rejection could not be inspected safely; the attempt was stopped without trusting hostile disclosure fields.",
      costUnits: 0,
      availableOutput: null,
    };
  }
};
