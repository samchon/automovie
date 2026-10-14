import type { ConnectedBodyResult } from "@automovie/human/body/runtime/ConnectedBodyResult";
import type { ConnectedFaceResult } from "@automovie/human/face/runtime/ConnectedFaceResult";

/**
 * One original product result, error or document-admission response.
 *
 * @evidence contracts/common.md#principled-implementation Correlates original product preview/construct/export results, document-only admission or named failure with one numerical request id.
 * @evidence contracts/common.md#clear-and-simple-design Optional reply alternatives let the transport preserve existing domain outputs without fabricating a preview for a rejected construction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The plain interface does not enforce alternative consistency; the page requires actual success/value or admission/reason and rejects incompatible replies.
 * @evidence contracts/common.md#meaningful-documentation Documents original operation/value, null owner-admission reason and completed runtime milliseconds rather than planned work.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This shape performs no build; advanced IPC/devalue serialization scale with produced output and domain owners measure runtime work.
 * @evidence contracts/performance.md#reuse-equivalent-work Correlation removes the exact pending request; a reply from a retired/unknown id cannot settle a different display's work.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Pending maps retire on reply/failure and the returned model lives with viewport/resident ownership; the envelope owns no extra numerical realm.
 *
 * @author Samchon
 */
export interface IHumanViewerNumericalReply {
  /** Request correlation within one owned numerical realm. */
  id: number;

  /** A successful build retains the original operation and complete value. */
  success?: boolean;

  /** Original preview or construct; no rejected draft becomes a preview. */
  value?: ConnectedFaceResult | ConnectedBodyResult;

  /** Completed runtime cost, not an admission estimate. */
  buildMs?: number;

  /** Original document-only admission alternative. */
  admission?: boolean;

  /** Original admission reason; null means admitted by that owner. */
  reason?: string | null;

  /** Failed execution reason, without a manufactured numerical value. */
  error?: string;
}
