/**
 * A stage signal a resident numerical worker posts while one request is still
 * being answered. It carries no result and no correlation identity: the
 * transport sends one request at a time, so the signal belongs to the request
 * in flight. Its only effect is to tell the transport that the worker is
 * alive and has finished a named stage, which restarts the silence deadline.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Lets a long evaluation or static encoding report that it is still progressing instead of being retired by a fixed duration.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Separates liveness of the resident worker from the reply that may publish a model.
 * @author Samchon
 */
export interface IConnectedBodyProgress {
  /** Name of the stage the worker just finished; display and diagnosis only. */
  progress: string;
}
