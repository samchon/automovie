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
 * @evidence contracts/common.md#principled-implementation A named authored rule and optional side identify an instrument independently of the channel being solved.
 * @evidence contracts/common.md#clear-and-simple-design Side orientation reuses one rule instead of storing duplicated left and right rule geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The exterior target table owns rule-to-channel binding; this reading names no fixture-specific numerical target.
 * @evidence contracts/common.md#meaningful-documentation The comment explains a one-sided channel and omitted-side behavior.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The alternate instrument bindings declaration is erased by TypeScript and chooses no runtime algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The alternate instrument bindings schema coordinates no requests or cached computations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The alternate instrument bindings type acquires no handles, tasks or retained storage.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyMeasuredChannelReading {
  /** Key of the authored rule in `HUMAN_BODY_MEASUREMENTS`. */
  rule: string;

  /** The side to read a one-sided rule on; omitted reads the rule as authored. */
  side?: AutoMovieHumanBodySide;
}
