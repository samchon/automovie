/**
 * Inputs of `mountConnectedPersonAdmissionReport`: where the report is drawn
 * and the sink that saves it on request.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Gives the admission report its place on the editor screen and its explicit save.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Keeps the report outside the editing controls so it stays readable in every state.
 * @author Samchon
 */
export interface IConnectedPersonAdmissionReportProps {
  /** Element the report fills; it stays outside the editing fieldset. */
  container: HTMLElement;

  /** Save bytes the user asked for under a file name. */
  download: (name: string, bytes: BlobPart, mime: string) => void;
}
