import { IAutoMovieRepaintSequenceObservation } from "@automovie/interface";

/**
 * Admit completed, failed, not-run or unsupported as declared observation status. Only the later completion check requires completed; status spelling performs no playback.
 *
 * @evidence contracts/common.md#principled-implementation Exact comparisons against the closed observation-status vocabulary keep unperformed or unsupported observation explicitly representable.
 * @evidence contracts/common.md#clear-and-simple-design Vocabulary admission remains separate from the diagnostic owner's completed-status requirement.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Failed/not-run/unsupported are not rewritten as completed and accepted spelling is no physical observation proof.
 * @evidence contracts/common.md#meaningful-documentation Prose distinguishes admitted status from completed qualification and actual playback.
 * @evidence contracts/performance.md#efficient-algorithms At most four exact comparisons use fixed storage with cost limited by compared status text.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Status admission coordinates no playback requests or cached verdicts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a boolean escapes and no status record, browser or task is retained.
 */
export const productionRepaintObservationIsStatus: (value: IAutoMovieRepaintSequenceObservation["status"]) => boolean = (
  value: IAutoMovieRepaintSequenceObservation["status"],
): boolean =>
  value === "completed" ||
  value === "failed" ||
  value === "not-run" ||
  value === "unsupported";
