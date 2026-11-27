import type { AutoMovieHumanLimb, IAutoMovieMotionHumanSupportCarry, IAutoMovieVector3 } from "@automovie/interface";

export namespace ClimbStairsCarryData {
  /*
   * Each world goal that can follow the stair body or a held foot.
   */
  export const LIMBS: readonly AutoMovieHumanLimb[] = [
    "leftArm",
    "rightArm",
    "leftLeg",
    "rightLeg",
  ];

  /*
   * A carry that leaves everything where it is.
   */
  export const STILL: IAutoMovieMotionHumanSupportCarry.ICarry = {
    point: (p: IAutoMovieVector3): IAutoMovieVector3 => p,
    turn: { x: 0, y: 0, z: 0, w: 1 },
    yaw: 0,
  };
}
