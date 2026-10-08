import type { ConnectedBodyResult } from "@automovie/playground/src/human/body/ConnectedBodyResult";
import type { ConnectedFaceResult } from "@automovie/playground/src/human/common/ConnectedFaceResult";

/** One original product result, error or document-admission response. @author Samchon */
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
