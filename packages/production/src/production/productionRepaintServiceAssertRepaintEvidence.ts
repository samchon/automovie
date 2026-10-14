import { IAutoMovieRepaintRequestEvidence } from "@automovie/interface";

/**
 * Rejects blank evidence strings while retaining the existing nullable continuity evidence contract before execution.
 *
 * @evidence contracts/common.md#principled-implementation Rejects blank evidence strings while retaining the existing nullable continuity evidence contract before execution.
 * @evidence contracts/common.md#clear-and-simple-design This file-named helper owns one original service value/admission operation; project lookup, dispatch and publication sequencing remain with the service coordinator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches use the supplied value and existing protocol/refusal contract; this helper adds no consumer-specific answer, substituted global or foreign-method replacement.
 * @evidence contracts/common.md#meaningful-documentation No evidence document, cache or external resource is retained.
 * @evidence contracts/performance.md#efficient-algorithms String checks scale with supplied evidence text and do not inspect or certify linked document content.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This per-call value/disclosure operation does not coordinate completed or in-flight results across requests; its original inputs remain local and its callers own effectful equivalence/currentness.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No evidence document, cache or external resource is retained.
 */
export const productionRepaintServiceAssertRepaintEvidence: (evidence: IAutoMovieRepaintRequestEvidence) => void = (
  evidence: IAutoMovieRepaintRequestEvidence,
): void => {
  for (const [key, value] of Object.entries(evidence)) {
    if (key === "continuity" && value === null) continue;
    if (
      typeof value !== "string" ||
      value.trim().length === 0 ||
      value !== value.trim()
    )
      throw new Error(
        `Repaint request evidence ${key} must be a trimmed non-empty stable address.`,
      );
  }
};
