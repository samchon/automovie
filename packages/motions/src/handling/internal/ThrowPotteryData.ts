import type { AutoMovieHumanSide } from "@automovie/interface";

export namespace ThrowPotteryData {
  /*
   * The outer palm on the outside face, the inner on the inside.
   */
  export const PAIRS: readonly IPair[] = [
    { side: "right", face: "outside" },
    { side: "left", face: "inside" },
  ];

  /*
   * The head's speed when none is given, revolutions per minute: a provisional
   * throwing speed.
   */
  export const RPM: number = 120;

  /*
   * A palm and the wall face it lies on.
   */
  export interface IPair {
    /*
     * The hand.
     */
    side: AutoMovieHumanSide;

    /*
     * The wheel's face.
     */
    face: string;
  }
}
