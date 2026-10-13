import type { IConnectedBodyArmsDownResult } from "./IConnectedBodyArmsDownResult";
import type { IConnectedBodyConstructionExportResult } from "./IConnectedBodyConstructionExportResult";
import type { IConnectedBodyConstructionResult } from "./IConnectedBodyConstructionResult";
import type { IConnectedBodyExportResult } from "./IConnectedBodyExportResult";
import type { IConnectedBodyPreviewResult } from "./IConnectedBodyPreviewResult";

/** The matching result for one worker request.
 */
export type ConnectedBodyResult =
  | IConnectedBodyPreviewResult
  | IConnectedBodyExportResult
  | IConnectedBodyArmsDownResult
  | IConnectedBodyConstructionResult
  | IConnectedBodyConstructionExportResult;
