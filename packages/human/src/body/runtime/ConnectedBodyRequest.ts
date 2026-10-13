import type { IConnectedBodyArmsDownRequest } from "./IConnectedBodyArmsDownRequest";
import type { IConnectedBodyConstructionExportRequest } from "./IConnectedBodyConstructionExportRequest";
import type { IConnectedBodyConstructionRequest } from "./IConnectedBodyConstructionRequest";
import type { IConnectedBodyExportRequest } from "./IConnectedBodyExportRequest";
import type { IConnectedBodyPreviewRequest } from "./IConnectedBodyPreviewRequest";

/**
 * Closed operations accepted by the resident body worker.
 *
 * @evidence contracts/common.md#principled-implementation Preview, ordinary export, arms-down solve and explicit construction/encoding requests retain distinct operation literals and their owning payload types.
 * @evidence contracts/common.md#clear-and-simple-design One discriminated union routes the existing worker operations without replacing authored body documents with geometry controls.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Construction requests remain separate from admitted ordinary preview/export, and the union alone performs no schema, clinical or request-freshness admission.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies resident-worker operations while each referenced request owns its serialized input and explicit scope.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Request union typing performs no body evaluation or operation dispatch.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The union implements no worker cache or supersession policy.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This type acquires no worker, serialized-document storage or buffer transfer.
 * @author Samchon
 */
export type ConnectedBodyRequest =
  | IConnectedBodyPreviewRequest
  | IConnectedBodyExportRequest
  | IConnectedBodyArmsDownRequest
  | IConnectedBodyConstructionRequest
  | IConnectedBodyConstructionExportRequest;
