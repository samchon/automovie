/** Whether a value satisfies a target in the declared direction.  * @evidence requirements/diagnostics/collection-fail-fast-and-determinism.md#diagnostics-completeness-determinism `AUTOMOVIE_ANALYSIS_DOMAINS` fixes the complete domain vocabulary and the order in which analysis outcomes roll up.
 * @evidence specifications/validation-and-diagnostics/collection-order-and-termination.md#validation-result-completeness-determinism The single ordered table gives validation and summaries the same deterministic domain traversal.
 * @author Samchon
 */
export const satisfied = (
  value: number,
  target: number,
  comparison: IAutoMovieAnalysisTarget["comparison"],
): boolean => (comparison === "at-least" ? value >= target : value <= target);
