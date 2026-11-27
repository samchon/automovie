import type { AutoMovieHumanSide } from "@automovie/interface";

export namespace HumanBikeTransferData {
  /*
   * Number of intervals over which the authored stationary segment is probed.
   */
  export const INTERVALS: number = 8;

  /*
   * The selected bicycle's pedal sides.
   */
  export const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];
}
