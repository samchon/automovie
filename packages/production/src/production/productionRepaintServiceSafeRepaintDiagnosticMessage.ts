/**
 * Safely reads Error.message or stringifies unknown refusal, returning trimmed text or the original fallback when inspection is unsafe.
 *
 * @evidence contracts/common.md#principled-implementation Safely reads Error.message or stringifies unknown refusal, returning trimmed text or the original fallback when inspection is unsafe.
 * @evidence contracts/common.md#clear-and-simple-design This file-named helper owns one original service value/admission operation; project lookup, dispatch and publication sequencing remain with the service coordinator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches use the supplied value and existing protocol/refusal contract; this helper adds no consumer-specific answer, substituted global or foreign-method replacement.
 * @evidence contracts/common.md#meaningful-documentation Only the safe string survives; the caught object is not cached.
 * @evidence contracts/performance.md#efficient-algorithms Text conversion follows supplied stringification cost and cannot turn a thrown diagnostic into a successful repaint.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This per-call value/disclosure operation does not coordinate completed or in-flight results across requests; its original inputs remain local and its callers own effectful equivalence/currentness.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the safe string survives; the caught object is not cached.
 */
export const productionRepaintServiceSafeRepaintDiagnosticMessage: (error: unknown, fallback: string) => string = (
  error: unknown,
  fallback: string,
): string => {
  try {
    const message: unknown =
      error instanceof Error ? error.message : String(error);
    return typeof message === "string" && message.trim().length !== 0
      ? message.trim()
      : fallback;
  } catch {
    return fallback;
  }
};
