import type { IReviewDrawnFrame } from "../review/IReviewDrawnFrame";

/**
 * A body PNG retaining its actual response authority and isolation selection.
 * @author Samchon
 */
export interface IBodyDrawnFrame extends IReviewDrawnFrame {
  /** PNG Buffer owned by this result; output writers and hash builders read it without mutation. */
  bytes: Buffer;

  /** Displayed mesh names selected for isolation; null draws the assembled body. */
  isolate: string[] | null;
}
