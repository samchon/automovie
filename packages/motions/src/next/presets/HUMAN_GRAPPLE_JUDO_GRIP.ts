import type { IAutoMovieMotionHumanGrapple } from "@automovie/interface";

/**
 * The judo grip preset: judo's grip (kumikata) for a throw, the right hand on
 * the partner's left collar and the left on the right sleeve, held two seconds
 * (provisional). Spread into `clinch`'s parameters beside the partner; each
 * value means what the clinch's member of the same name does. The `judoGrip`
 * row of `HumanPartner` fixes these values.
 */
export const HUMAN_GRAPPLE_JUDO_GRIP: IAutoMovieMotionHumanGrapple.IClinchPreset =
  {
    grip: "collarSleeve",
    hold: 2,
  };
