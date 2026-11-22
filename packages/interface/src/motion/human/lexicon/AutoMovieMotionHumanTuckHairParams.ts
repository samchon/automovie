import type { IAutoMovieMotionHumanArmPhrase } from "../compose/IAutoMovieMotionHumanArmPhrase";

/**
 * The acting hand and manner of an ear tuck. The right hand and neutral
 * manner are used when omitted. `both` sweeps each ear on the same clock.
 * Register `tuckHair` with the performance before authoring it by name.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the caller selects, the omitted defaults, and how to author the law.
 * @evidence contracts/development/design.md#principled-representation Uses the arm phrase's canonical side and manner contracts, including their optionality.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only side and manner vary; the ear, stroke and hand shape belong to the row.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The type projects the canonical authoring contract without depending on a runtime law.
 */
export type AutoMovieMotionHumanTuckHairParams = Pick<
  IAutoMovieMotionHumanArmPhrase.IParams,
  "hand" | "manner"
>;
