import type { IReviewCaptureRecord } from "./IReviewCaptureRecord";
import type { IReviewDrawnFrame } from "./IReviewDrawnFrame";

/**
 * A run's authority and its actual pixels supplied to the record builder.
 * The caller derives common authority from the successful render responses.
 * @author Samchon
 */
export interface IReviewCaptureRecordProps extends Omit<
  IReviewCaptureRecord,
  "captures"
> {
  /** Caller-owned actual frames; the builder reads bytes to hash them and omits pixels from its output. */
  frames: IReviewDrawnFrame[];
}
