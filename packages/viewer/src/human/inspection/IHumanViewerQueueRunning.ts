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
 * @author Samchon
 */
export interface IHumanViewerQueueRunning {
  /** Request label, the route and query. */
  label: string;

  /** Clock reading at its start, in milliseconds. */
  start: number;
}
