/**
 * The worker's reply to an explicit export request: the static GLB bytes.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-export Returns portable GLB bytes when requested.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-export Carries encoded output separately from display geometry.
 * @author Samchon
 */
export interface IConnectedBodyExportResult {
  /** Reply kind. */
  operation: "export";

  /** Binary glTF bytes, transferred with the reply. */
  glb: Uint8Array<ArrayBuffer>;
}
