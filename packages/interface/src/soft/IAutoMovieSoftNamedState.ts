import { IAutoMovieSoftAnchorPose } from "./IAutoMovieSoftAnchorPose";

/**
 * Named static override of a panel's anchor targets.
 *
 * @evidence contracts/common.md#principled-implementation The solver resolves the selected state by id before the seek and applies its listed anchor poses over declared static or rest targets.
 * @evidence contracts/common.md#clear-and-simple-design A state contains only changed anchor targets; unchanged anchors keep their domain definition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unknown state causes refusal rather than falling back to the first state; the list does not author creases or time-varying keyframes.
 * @evidence contracts/common.md#meaningful-documentation Comments state same-domain identity and omission semantics; targets are held by the static path, while moving-boundary evaluation replaces bound anchors with its supplied targets.
 */
export interface IAutoMovieSoftNamedState {
  /** Stable state identity within the domain, such as `open` or `closed`. */
  id: string;

  /**
   * Static overrides of the listed anchors. Omitted anchors retain their static/rest targets; complete moving boundaries supersede these initial targets for anchors with a moving binding.
   */
  anchors: IAutoMovieSoftAnchorPose[];
}
