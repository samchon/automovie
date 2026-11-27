import type { AutoMovieHumanSide } from "@automovie/interface";

export namespace HumanBicycleEffortData {
  /*
   * Sides of the bicycle contact pairs.
   */
  export const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];

  /*
   * Forward pelvic transfer as a share of vertical effort, provisional for film
   * blocking.
   */
  export const FORWARD: number = 0.35;

  /*
   * Additional trunk inclination over the flying saddle, in provisional staging
   * degrees.
   */
  export const INCLINE: number = 7;

  /*
   * Metres permitted between declared placement and the displayed contact.
   */
  export const FIT: number = 0.01;

  /*
   * Intervals checked in each rising, standing and lowering phase.
   */
  export const INTERVALS: number = 8;
}
