import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";

/**
 * One standing curtsy with a cross behind the supporting leg, a dip, and a
 * return to the original stance. The registered curtsy law admits the timing
 * and depth against the performer's available planted reach.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the gesture, each input's units and defaults, and the admission owner.
 * @evidence contracts/development/design.md#principled-representation Uses the canonical side and the body's own dimensions for the authored dip.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the crossing side, dip depth, and overall time independently.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No fixture geometry or unchecked free-form targets.
 */
export interface IAutoMovieMotionHumanCurtsy {
  /** Foot that crosses behind the other, right when absent. */
  side?: AutoMovieHumanSide;

  /** Additional pelvis drop from the crossed standing posture, as a share of hip height in (0, 0.08]. Defaults to 0.045. */
  depth?: number;

  /** Seconds for weight transfer, crossing, dipping and recovery together. Defaults to 1.8 s at 0.93 m hip height, scaled by the square root of hip height. */
  duration?: number;
}
