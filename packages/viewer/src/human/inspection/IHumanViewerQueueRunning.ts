/**
 * The request the GPU page is working on.
 *
 * The label and clock origin describe the task occupying one GPU slot. They do not establish a job lease or permit termination by age.
 *
 * @author Samchon
 */
export interface IHumanViewerQueueRunning {
  /** Request label, the route and query. */
  label: string;

  /** Clock reading at its start, in milliseconds. */
  start: number;
}
