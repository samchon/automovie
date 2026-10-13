import { IAutoMovieSoftAnchorPose } from "./IAutoMovieSoftAnchorPose";

/**
 * Named static override of a panel's anchor targets.
 *
 * @evidence contracts/common.md#principled-implementation The solver resolves the selected state by id before the seek and applies its listed anchor poses over declared static or rest targets.
 * @evidence contracts/common.md#clear-and-simple-design A state contains only changed anchor targets; unchanged anchors keep their domain definition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unknown state causes refusal rather than falling back to the first state; the list does not author creases or time-varying keyframes.
 * @evidence contracts/common.md#meaningful-documentation Comments state same-domain identity and omission semantics, making clear that this is a held boundary condition.
 * @author Samchon
 */
export interface IAutoMovieSoftNamedState {
  /** Stable state identity within the domain, such as `open` or `closed`. */
  id: string;

  /**
   * Anchors this state moves. Anchors absent from the list keep their declared position, so `open` states only the rings that actually gather.
   */
  anchors: IAutoMovieSoftAnchorPose[];
}
