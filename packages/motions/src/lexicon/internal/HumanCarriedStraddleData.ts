import type { AutoMovieHumanoidBone } from "@automovie/interface";

export namespace HumanCarriedStraddleData {
  /*
   * A knee at either side of the bearer's pelvis, in left-to-right order.
   */
  export const KNEES: readonly AutoMovieHumanoidBone[] = [
    "leftLowerLeg",
    "rightLowerLeg",
  ];
}
