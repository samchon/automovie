import type { AutoMovieHumanoidBone } from "@automovie/interface";

export namespace SitOnLapData {
  /*
   * How far behind the seat's front edge the sit law rests the seat socket, short
   * of the sitter's thigh, metres: `IAutoMovieMotionHumanSeated`'s 0.05 m
   * clearance.
   */
  export const CLEARANCE: number = 0.05;

  /*
   * Both displayed thighs and their knee endpoints define the receiver frame.
   */
  export const LEGS: ReadonlySet<AutoMovieHumanoidBone> = new Set([
    "leftUpperLeg",
    "rightUpperLeg",
    "leftLowerLeg",
    "rightLowerLeg",
  ]);

  /*
   * The two receiving sides of a lap.
   */
  export const THIGHS: readonly ["thighFrontLeft", "thighFrontRight"] = [
    "thighFrontLeft",
    "thighFrontRight",
  ];

  /*
   * Contact tolerance for jointed, paired body surfaces, metres.
   */
  export const BEARING: number = 0.01;
}
