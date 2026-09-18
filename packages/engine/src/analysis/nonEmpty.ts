/**
 * Shared by validateAutoMovieAnalysisRun, autoMovieAnalysisRunDigest, which were one file until each public identity took its own.
 *
 * @evidence requirements/diagnostics/collection-fail-fast-and-determinism.md#diagnostics-completeness-determinism `AUTOMOVIE_ANALYSIS_DOMAINS` fixes the complete domain vocabulary and the order in which analysis outcomes roll up.
 * @evidence specifications/validation-and-diagnostics/collection-order-and-termination.md#validation-result-completeness-determinism The single ordered table gives validation and summaries the same deterministic domain traversal.
 * @author Samchon
 */
export const nonEmpty = (
  value: string,
  path: string,
  label: string,
  out: ViolationCollector,
): void => {
  if (value.trim().length === 0)
    out.push("type", path, `${label} must be non-empty`, value);
};
