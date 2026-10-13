/**
 * A worker request to encode the committed body document as static GLB.
 *
 * @author Samchon
 */
export interface IConnectedBodyExportRequest {
  /**
   * Request kind.
   *
   */
  operation: "export";

  /**
   * Serialized committed document to export.
   *
   */
  document: string;
}
