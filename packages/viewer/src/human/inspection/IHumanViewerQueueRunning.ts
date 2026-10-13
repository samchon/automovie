/**
 * The request the GPU page is working on.
 *
 * The label and clock origin describe the task occupying one GPU slot. They do not establish a job lease or permit termination by age.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the request and when it started.
 *
 * @evidence contracts/common.md#principled-implementation The active task label and monotonic start reading identify the actual GPU work occupying the queue.
 * @evidence contracts/common.md#clear-and-simple-design Only active request identity and its clock origin are retained.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A start timestamp reports duration and supplies no elapsed-age cancellation policy.
 *
 * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-progress-remaining-work The active task label and monotonic start reading identify the actual GPU work occupying the queue.
 * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-progress-snapshot A start timestamp reports duration and supplies no elapsed-age cancellation policy.
 *
 * @author Samchon
 */
export interface IHumanViewerQueueRunning {
  /**
   * Request label, the route and query.
   *
   * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-progress-remaining-work Identifies the actual route/query task currently occupying the GPU queue slot.
   * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-progress-snapshot Identifies the actual route/query task currently occupying the GPU queue slot.
   */
  label: string;

  /**
   * Clock reading at its start, in milliseconds.
   *
   * @evidence requirements/operations-and-recovery/observability-and-secret-protection.md#operations-progress-remaining-work Retains its monotonic millisecond start reading for duration observation without permitting age-based cancellation.
   * @evidence specifications/execution-and-recovery/progress-heartbeats-and-observation.md#execution-progress-snapshot Retains its monotonic millisecond start reading for duration observation without permitting age-based cancellation.
   */
  start: number;
}
