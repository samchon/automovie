import type { IAutoMovieDeliveryContentAudit } from "../delivery/IAutoMovieDeliveryContentAudit.js";
import type { IAutoMovieInspectionDiagnostics } from "../inspection/IAutoMovieInspectionDiagnostics.js";
import type { IAutoMovieRenderedFrameReceipt } from "./IAutoMovieRenderedFrameReceipt.js";

/**
 * Successful sequential beauty capture and encoding receipts.
 * renderAutoMovieDrawnVideo returns after the host encoder resolves, with one
 * receipt per written frame, the actual encoder arguments, and an audit when
 * the subject supplied diagnostics. Failed drawing/writing/encoding rejects
 * without returning partial success; prior files remain host-owned.
 */
export interface IAutoMovieDrawnVideoResult {
  /** The subject's frames, in order, each with its second, file and pixel hash. */
  frames: IAutoMovieRenderedFrameReceipt[];

  /** The arguments the encoder ran with. */
  args: string[];

  /** The exact frame rate commissioned to the encoder. */
  frameRate: IAutoMovieDeliveryContentAudit.Ratio;

  /**
   * Findings and coverage against the full output schedule, when the subject
   * supplied diagnostics.
   */
  diagnostics?: IAutoMovieInspectionDiagnostics.IAudit;
}
