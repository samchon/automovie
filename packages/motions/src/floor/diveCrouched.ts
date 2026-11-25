import { minimumJerk } from "@automovie/engine";
import type { IAutoMovieMotionHumanPosture } from "@automovie/interface";

import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { dive } from "./dive";

/**
 * The take-off crouch at a second: the minimum-jerk crouch, the feet rolling
 * onto their toes over its last `TOE_OFF` seconds with the toes bent at their
 * joints so they stay on the floor.
 *
 * Part of `dive.plan`, which prepares it once per plan.
 *
 * @param prepared What the plan prepared for it.
 * @returns The plan's `crouched`.
 */
export function diveCrouched(
  prepared: diveCrouched.IPrepared,
): (
  seconds: number,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
) => IAutoMovieMotionHumanPosture {
  const { crouch, toeOff, lift, crouchedOn, rolled }: diveCrouched.IPrepared =
    prepared;
  return (
    seconds: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
  ): IAutoMovieMotionHumanPosture => {
    const share: number = minimumJerk.share(seconds / crouch);
    const toe: number = minimumJerk.share(
      Math.max(0, (seconds - (crouch - toeOff)) / toeOff),
    );
    if (!(toe > 0 && (lift.left > 0 || lift.right > 0)))
      return crouchedOn(share, undefined, resolution, projection);
    const posture: IAutoMovieMotionHumanPosture = crouchedOn(
      share,
      rolled({ left: lift.left * toe, right: lift.right * toe }),
      resolution,
      projection,
    );
    // With the heels up the toes bend at their joints and stay on the floor.
    return {
      ...posture,
      joints: {
        ...posture.joints,
        leftToes: [lift.left * toe, 0, 0],
        rightToes: [lift.right * toe, 0, 0],
      },
    };
  };
}

/** The `crouched` of `dive.plan`, built from what that plan prepared. */
export namespace diveCrouched {
  /** What `dive.plan` prepared for its `crouched`. */
  export interface IPrepared {
    /** The `crouch` `dive.plan` prepared. */
    crouch: number;

    /** The `toeOff` `dive.plan` prepared. */
    toeOff: number;

    /** The `lift` `dive.plan` prepared. */
    lift: dive.Lift;

    /** The `crouchedOn` `dive.plan` prepared. */
    crouchedOn: (
      share: number,
      on?: dive.Feet,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
    ) => IAutoMovieMotionHumanPosture;

    /** The `rolled` `dive.plan` prepared. */
    rolled: (lift: dive.Lift) => dive.Feet;
  }
}
