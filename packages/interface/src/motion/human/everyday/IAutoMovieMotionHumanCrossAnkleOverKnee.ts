import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * An ankle-over-knee rest after sitting on a chair with both feet down.
 *
 * The registered crossAnkleOverKnee law owns admission against the entry
 * seat, floor contacts and the performer's leg reach.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the entry, the raised side, the held duration and the owner of admission.
 * @evidence contracts/development/design.md#principled-representation Models the authored raised side and held seconds as independent inputs.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Parameters for the opt-in crossAnkleOverKnee law; the prior sit supplies the seat and support geometry.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the canonical side and the entry seat instead of accepting replacement anatomical points.
 */
export interface IAutoMovieMotionHumanCrossAnkleOverKnee {
  /** The ankle to lift over the other knee. Defaults to right. */
  side?: AutoMovieHumanSide;

  /** Seconds resting across the other knee before returning. Defaults to 1. Minimum 0. */
  hold?: number;
}
