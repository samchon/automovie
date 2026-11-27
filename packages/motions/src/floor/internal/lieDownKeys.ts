import type {
  IAutoMovieMotionHumanLieDown,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { floorEntry } from "./floorEntry";
import { lieDown } from "./lieDown";

/*
 * The route's keys: the entry's own tilt and joints (the frozen stand, or the
 * posture the entry displays), then each route key's authored pose.
 *
 * Part of `lieDown.plan`, which prepares it once per plan.
 * Parameter prepared: What the plan prepared for it.
 * Returns: The plan's `keys`.
 */
export function lieDownKeys(
  prepared: lieDownKeys.IPrepared,
): IAutoMovieMotionHumanLieDown.IPose[] {
  const { entered, stoodPose, route }: lieDownKeys.IPrepared = prepared;
  return [
    entered === null
      ? {
          pitch: stoodPose.pitch,
          roll: stoodPose.roll,
          joints: stoodPose.joints,
        }
      : { pitch: entered.pitch, roll: entered.roll, joints: entered.joints },
    ...route.map(([key]) => lieDown.POSES[key as keyof typeof lieDown.POSES]),
  ];
}

/*
 * The `keys` of `lieDown.plan`, built from what that plan prepared.
 */
export namespace lieDownKeys {
  /*
   * What `lieDown.plan` prepared for its `keys`.
   */
  export interface IPrepared {
    /*
     * The `entered` `lieDown.plan` prepared.
     */
    entered: floorEntry.IStart["entered"];

    /*
     * The `stoodPose` `lieDown.plan` prepared.
     */
    stoodPose: IAutoMovieMotionHumanPosture;

    /*
     * The `route` `lieDown.plan` prepared.
     */
    route: readonly [string, string][];
  }
}
