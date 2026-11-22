import type { IAutoMovieMotionHumanGrapple } from "@automovie/interface";

/**
 * The judo grip preset: judo's grip (kumikata) for a throw, the right hand on
 * the partner's left collar and the left on the right sleeve, held two seconds
 * (provisional). Spread into `clinch`'s parameters beside the partner; each
 * value means what the clinch's member of the same name does. The `judoGrip`
 * row of `HumanPartner` fixes these values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the grip and the hold the preset fixes, how it is applied, which row reads it and what is provisional.
 * @evidence contracts/development/design.md#principled-representation The clinch's own named members as one `IClinchPreset`, so the preset fixes exactly the grip and the hold and the clinch keeps every other default.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanGrapple.JUDO_GRIP`; the judoGrip row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_GRAPPLE_JUDO_GRIP: IAutoMovieMotionHumanGrapple.IClinchPreset =
  {
    grip: "collarSleeve",
    hold: 2,
  };
