import type { IAutoMovieMotionHumanHand } from "@automovie/interface";

/*
 * The share of the body's weight the leaning chest lays on the partner's back
 * (provisional: a light lean).
 */
export const LEAN: number = 0.1;

/*
 * The real surface points that may reach the partner's midline.
 */
export const TIPS: readonly IAutoMovieMotionHumanHand.DigitSurface[] = [
  "thumbTip",
  "indexTip",
  "middleTip",
  "ringTip",
  "littleTip",
];
