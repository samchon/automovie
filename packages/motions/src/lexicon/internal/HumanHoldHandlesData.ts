import type { AutoMovieHumanSide } from "@automovie/interface";

export namespace HumanHoldHandlesData {
  /*
   * The two hands, left first.
   */
  export const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];

  /*
   * The displayed hand's largest admitted miss of its handle's skin, metres: the
   * contact tolerance of the towed driver and the lead.
   */
  export const REACH: number = 0.01;
}
