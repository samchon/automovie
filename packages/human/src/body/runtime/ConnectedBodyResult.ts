import type { IConnectedBodyArmsDownResult } from "./IConnectedBodyArmsDownResult";
import type { IConnectedBodyConstructionExportResult } from "./IConnectedBodyConstructionExportResult";
import type { IConnectedBodyConstructionResult } from "./IConnectedBodyConstructionResult";
import type { IConnectedBodyExportResult } from "./IConnectedBodyExportResult";
import type { IConnectedBodyPreviewResult } from "./IConnectedBodyPreviewResult";

/**
 * Operation-discriminated results returned by the resident body worker.
 *
 * @evidence contracts/common.md#principled-implementation Preview buffers, static export bytes, arms-down document rows and explicit construction/admission outputs preserve their distinct result payload owners.
 * @evidence contracts/common.md#clear-and-simple-design One closed reply union lets hosts dispatch by operation while detailed buffer and admission schemas remain separately owned.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A result union cannot prove pairing with an arbitrary request or upgrade rejected construction into ordinary accepted anatomy.
 * @evidence contracts/common.md#meaningful-documentation The comment names worker reply scope and each referenced result specifies its operation and output ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Reply typing performs no body solve, packing or serialization.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The result union implements no cache of prior worker outputs.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The declaration acquires no worker task, GLB resource or message buffer lifetime.
 * @author Samchon
 */
export type ConnectedBodyResult =
  | IConnectedBodyPreviewResult
  | IConnectedBodyExportResult
  | IConnectedBodyArmsDownResult
  | IConnectedBodyConstructionResult
  | IConnectedBodyConstructionExportResult;
