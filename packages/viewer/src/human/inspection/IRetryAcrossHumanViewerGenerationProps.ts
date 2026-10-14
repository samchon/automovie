/**
 * How a generation-change retry waits and how often it tries.
 *
 * @evidence contracts/common.md#principled-implementation Retry policy supplies a drawable-generation wait and a total-attempt budget for message-classified interruptions; the caller must make its operation replay-safe and supply a finite positive integer budget because the generic retry owner validates neither premise.
 * @evidence contracts/common.md#clear-and-simple-design The retry owner handles error classification while the host owns waiting for its actual page generation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Only errors matching the maintained generation wording qualify; nonmatching failures propagate, while text recognition does not independently establish cause provenance.
 * @evidence contracts/common.md#meaningful-documentation Comments define settling until drawing resumes and attempts including the first execution with the last refusal preserved.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The retry-props declaration chooses no polling or wait scheduling algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This policy requests a fresh operation after settlement rather than reusing a stale-generation frame; replay safety and any earlier effects remain the caller's responsibility.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The policy borrows generation readiness and retains no browser ownership; physical capture settlement remains with queue/lifetime owners.
 *
 * @author Samchon
 */
export interface IRetryAcrossHumanViewerGenerationProps {
  /**
   * Wait until a source generation can draw again; reject if readiness cannot recover.
   *
   * @evidence contracts/common.md#principled-implementation Awaiting host generation readiness precedes another capture attempt after a classified source-generation interruption.
   * @evidence contracts/common.md#clear-and-simple-design Host-specific readiness is supplied as one asynchronous callback so retry logic does not inspect browser state itself.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The readiness callback cannot convert arbitrary capture errors into successful retries or return stale frame bytes.
   * @evidence contracts/common.md#meaningful-documentation The member states drawing readiness and rejection when that readiness cannot recover.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This wait signature does not select polling cadence or browser health observation strategy.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A readiness wait observes the current generation; completed readiness of the replaced generation is insufficient.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Waiting borrows host readiness and transfers no capture slot or renderer lifetime ownership.
   */
  settle: () => Promise<void>;

  /**
   * Finite positive integer total attempts including the first; a caller premise, not validated by the retry owner.
   */
  attempts: number;
}
