import type { IConnectedBodyArmsDownRequest } from "./IConnectedBodyArmsDownRequest";
import type { IConnectedBodyExportRequest } from "./IConnectedBodyExportRequest";
import type { IConnectedBodyPreviewRequest } from "./IConnectedBodyPreviewRequest";
import type { IConnectedBodyConstructionRequest } from "./IConnectedBodyConstructionRequest";
import type { IConnectedBodyConstructionExportRequest } from "./IConnectedBodyConstructionExportRequest";

/** A preview computes buffers; an export computes a file.
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Requests the body's numerical preview independently of file encoding.
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-export Requests a static file only on explicit export.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Separates preview transactions from file requests.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-export Sends the committed document to the static exporter.
 */
export type ConnectedBodyRequest =
  | IConnectedBodyPreviewRequest
  | IConnectedBodyExportRequest
  | IConnectedBodyArmsDownRequest
  | IConnectedBodyConstructionRequest
  | IConnectedBodyConstructionExportRequest;
