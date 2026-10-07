/**
 * The request the GPU page is working on.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the request and when it started.
 * @author Samchon
 */
export interface IHumanViewerQueueRunning {
  /** Request label, the route and query. */
  label: string;

  /** Clock reading at its start, in milliseconds. */
  start: number;
}
