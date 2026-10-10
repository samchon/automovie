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
 * @author Samchon
 */
export interface IAutoMovieHumanBodyMeasuredChannelReading {
  /** Key of the authored rule in `HUMAN_BODY_MEASUREMENTS`. */
  rule: string;

  /** The side to read a one-sided rule on; omitted reads the rule as authored. */
  side?: AutoMovieHumanBodySide;
}
