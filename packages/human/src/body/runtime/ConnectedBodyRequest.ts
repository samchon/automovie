import type { IConnectedBodyArmsDownRequest } from "./IConnectedBodyArmsDownRequest";
import type { IConnectedBodyConstructionExportRequest } from "./IConnectedBodyConstructionExportRequest";
import type { IConnectedBodyConstructionRequest } from "./IConnectedBodyConstructionRequest";
import type { IConnectedBodyExportRequest } from "./IConnectedBodyExportRequest";
import type { IConnectedBodyPreviewRequest } from "./IConnectedBodyPreviewRequest";

/** A preview computes buffers; an export computes a file.
 */
export type ConnectedBodyRequest =
  | IConnectedBodyPreviewRequest
  | IConnectedBodyExportRequest
  | IConnectedBodyArmsDownRequest
  | IConnectedBodyConstructionRequest
  | IConnectedBodyConstructionExportRequest;
