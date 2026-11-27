import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanLieDown,
} from "@automovie/interface";

import { lieDownPoses } from "./lieDownPoses";

/** The seated key `lieOnSurface` starts and ends on, on a support's edge. */
export namespace lieOnSurfaceSeat {
  /** The seated key and whether its soles reach the floor. */
  export interface IKey {
    /** The tilt and the joints. */
    pose: IAutoMovieMotionHumanLieDown.IPose;

    /** Whether the feet rest on the floor. */
    planted: boolean;
  }

  /**
   * The seated key on the edge: upright, the thighs level along the seat and
   * each shank leaning forward from upright by as much as brings its ankle to
   * its height over the floor, `acos((hip - ankle) / shank)`, so the soles rest
   * on the floor; a seat higher than the shank and the ankle leaves the shanks
   * upright and the feet hanging.
   *
   * @param body The body.
   * @param hip The seated hips' height, world metres.
   * @param floor The floor's height, world metres.
   * @returns The key and whether its soles reach the floor.
   */
  export function key(
    body: IAutoMovieMotionHumanBody,
    hip: number,
    floor: number,
  ): IKey {
    const reach: number =
      (hip - floor - body.measure.ankleHeight) / body.measure.shank;
    const lean: number =
      reach >= 1 ? 0 : (Math.acos(Math.max(-1, reach)) * 180) / Math.PI;
    const knee: number = 90 - lean;
    return {
      pose: {
        pitch: 0,
        roll: 0,
        joints: {
          ...lieDownPoses.POSES.sit.joints,
          leftUpperLeg: [90, 5, 0],
          rightUpperLeg: [90, 5, 0],
          leftLowerLeg: [knee, 0, 0],
          rightLowerLeg: [knee, 0, 0],
          // The shank's foot end ahead of its knee plantarflexes the ankle by the lean, the sole level.
          leftFoot: [-lean, 0, 0],
          rightFoot: [-lean, 0, 0],
          leftUpperArm: [10, 10, 0],
          rightUpperArm: [10, 10, 0],
        },
      },
      planted: reach <= 1,
    };
  }
}
