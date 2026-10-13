/**
 * The request the GPU page is working on.  The label and clock origin describe the task occupying one GPU slot. They do not establish a job lease or permit termination by age.
 *
 * @evidence contracts/common.md#principled-implementation Records the actual unsettled task occupying the queue's single GPU slot with label and shared monotonic clock start.
 * @evidence contracts/common.md#clear-and-simple-design Keeps running ownership separate from lane waiting counts and last-settled result telemetry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Requester cancellation does not clear this slot before actual task settlement, and task age is not a termination permission.
 * @evidence contracts/common.md#meaningful-documentation Documents route/query label and start milliseconds from the queue clock, not wall-clock or job-lease authority.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The record performs no scheduling; fixed three-lane selection and bounded waiting-array operations belong to the queue.
 * @evidence contracts/performance.md#reuse-equivalent-work The running reference is shared only for observation of that same task; equal labels do not merge requests.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Exactly one physically unsettled callback remains with the queue until finally; this scalar record owns no additional page or signal.
 *
 * @author Samchon
 */
export interface IHumanViewerQueueRunning {
  /** Request label, the route and query. */
  label: string;

  /** Clock reading at its start, in milliseconds. */
  start: number;
}
