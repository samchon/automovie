/**
 * The worker's reply to an explicit export request: the static GLB bytes.
 *
 * @author Samchon
 */
export interface IConnectedBodyExportResult {
  /** Reply kind. */
  operation: "export";

  /** Binary glTF bytes, transferred with the reply. */
  glb: Uint8Array<ArrayBuffer>;
}
