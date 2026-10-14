

/**
 * Why provider output remained raw rather than becoming an active candidate.
 *
 * Candidate-source can feed later media/selection admission; invalid, partial, cancelled and budget-exhausted outputs remain attempt-owned recovery evidence. None of these labels alone activates delivery.
 *
 * @evidence contracts/common.md#principled-implementation The closed disposition vocabulary retains both potentially usable candidate input and unsuccessful terminal output without conflating retention with selected delivery.
 * @evidence contracts/common.md#clear-and-simple-design Raw retention classification is separate from provider claim settlement and candidate/media publication.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained bytes are not discarded merely for an unsuccessful disposition, and candidate-source supplies no media or review certificate.
 * @evidence contracts/common.md#meaningful-documentation Prose gives recovery meaning for unsuccessful output and the later admission required by candidate-source.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The union performs no byte retention, copy, probe or selection algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Disposition spelling implements no recovery-source cache or effectful provider reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The erased type acquires no raw buffers, receipts or provider task.
 * @author Samchon
 */
export type AutoMovieRepaintRawOutputDisposition =
  | "candidate-source"
  | "invalid"
  | "partial"
  | "cancelled"
  | "budget-exhausted";
