/**
 * Inputs of `mountConnectedPersonAdmissionReport`: where the report is drawn
 * and the sink that saves it on request.
 *
 * @author Samchon
 */
export interface IConnectedPersonAdmissionReportProps {
  /** Element the report fills; it stays outside the editing fieldset. */
  container: HTMLElement;

  /** Save bytes the user asked for under a file name. */
  download: (name: string, bytes: BlobPart, mime: string) => void;
}
