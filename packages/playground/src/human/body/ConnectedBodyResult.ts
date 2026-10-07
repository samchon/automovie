import type { IConnectedBodyArmsDownResult } from "./IConnectedBodyArmsDownResult";
import type { IConnectedBodyConstructionExportResult } from "./IConnectedBodyConstructionExportResult";
import type { IConnectedBodyConstructionResult } from "./IConnectedBodyConstructionResult";
import type { IConnectedBodyExportResult } from "./IConnectedBodyExportResult";
import type { IConnectedBodyPreviewResult } from "./IConnectedBodyPreviewResult";

/** The matching result for one worker request.
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Returns numerical preview buffers for publication.
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-export Returns portable GLB bytes when requested.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Correlates preview output with the worker request.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-export Carries encoded output separately from display geometry.
 */
export type ConnectedBodyResult =
  | IConnectedBodyPreviewResult
  | IConnectedBodyExportResult
  | IConnectedBodyArmsDownResult
  | IConnectedBodyConstructionResult
  | IConnectedBodyConstructionExportResult;
