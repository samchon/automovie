import type { AutoMovieHumanBodySide } from "../anatomy/identity/AutoMovieHumanBodySide";

/**
 * The instrument a measured-channel solve reads when it is not the rule
 * named by the solved channel itself.
 *
 * A one-sided channel (`upperarmScaleHorizRight`) has no rule of its own;
 * the right arm's girth is the authored left rule read on the right side
 * (`orientHumanBodyMeasurement`). The binding of an anatomical target to its
 * rule, side and solving channel is owned by the exterior target table, not
 * by this reading.
 *
 * @evidence contracts/common.md#principled-implementation The rule and side name an existing authored instrument, so no right-side rule is copied to give a one-sided channel a reading.
 * @evidence contracts/common.md#clear-and-simple-design Two fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unknown rule or a side asked of a midline rule is refused by the solver rather than defaulted.
 * @evidence contracts/common.md#meaningful-documentation States why the reading is separate from the channel and who owns the binding.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels It names no channel.
 * @evidence contracts/modeling.md#spatial-conventions The side is the person's own (AutoMovieHumanBodySide).
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation It is not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The rule table owns the instrument's source.
 * @evidenceExclude contracts/anatomy.md#permitted-range It admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It converts no input.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyMeasuredChannelReading {
  /** Key of the authored rule in `HUMAN_BODY_MEASUREMENTS`. */
  rule: string;

  /** The side to read a one-sided rule on; omitted reads the rule as authored. */
  side?: AutoMovieHumanBodySide;
}
