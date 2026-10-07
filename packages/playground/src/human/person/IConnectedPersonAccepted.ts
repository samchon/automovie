/**
 * The accepted person the status line names: the committed document's display
 * name and its model's material region count.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Supplies the committed person's name and region count the editor reports.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Reads the committed pair without exposing the prepared frame.
 * @author Samchon
 */
export interface IConnectedPersonAccepted {
  /** Display name of the committed document. */
  name: string;

  /** Material regions of the committed model. */
  parts: number;
}
