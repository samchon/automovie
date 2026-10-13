import type { ConnectedBodyResult } from "@automovie/human/body/runtime/ConnectedBodyResult";
import type { ConnectedFaceResult } from "@automovie/human/face/runtime/ConnectedFaceResult";

/**
 * One original product result, error or document-admission response.
 *
 * @evidence contracts/common.md#principled-implementation Correlated product values, admission verdicts and execution errors preserve the original numerical owner's alternatives.
 * @evidence contracts/common.md#clear-and-simple-design One request id scopes optional result fields without adding a second model schema.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A refused or failed computation retains its cause and does not substitute a cached preview.
 * @evidence contracts/common.md#meaningful-documentation Missing value denotes no model result; null admission reason belongs to the owner's accepted document outcome.
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
