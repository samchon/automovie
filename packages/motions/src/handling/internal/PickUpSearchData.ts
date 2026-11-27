import type { IAutoMovieMotionHumanHand } from "@automovie/interface";

export namespace PickUpSearchData {
  /*
   * The digit tips a grip keeps above the floor.
   */
  export const TIPS: readonly IAutoMovieMotionHumanHand.DigitSurface[] = [
    "thumbTip",
    "indexTip",
    "middleTip",
    "ringTip",
    "littleTip",
  ];
}
