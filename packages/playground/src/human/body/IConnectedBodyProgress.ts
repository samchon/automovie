/**
 * A stage signal a resident numerical worker posts while one request is still
 * being answered. It carries no result and no correlation identity: the
 * transport sends one request at a time, so the signal belongs to the request
 * in flight. Its only effect is to tell the transport that the worker is
 * alive and has finished a named stage, without imposing a silence deadline.
 *
 * @author Samchon
 */
export interface IConnectedBodyProgress {
  /** Name of the stage the worker just finished; display and diagnosis only. */
  progress: string;
}
