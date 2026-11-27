import type { IAutoMovieMotionHumanPosture } from "@automovie/interface";
import { lieDownPoses } from "./lieDownPoses";

export namespace LogRollData {
  /*
   * Seconds of each half turn (provisional).
   */
  export const HALF: number = 0.7;

  /*
   * The straight log: legs extended, arms overhead along the long axis
   * (provisional angles).
   */
  export const LOG: IAutoMovieMotionHumanPosture["joints"] = {
    ...lieDownPoses.POSES.supine.joints,
    leftUpperLeg: [0, 3, 0],
    rightUpperLeg: [0, 3, 0],
    leftLowerLeg: [3, 0, 0],
    rightLowerLeg: [3, 0, 0],
    leftUpperArm: [160, 5, 0],
    rightUpperArm: [160, 5, 0],
    leftLowerArm: [10, 0, 0],
    rightLowerArm: [10, 0, 0],
  };
}
