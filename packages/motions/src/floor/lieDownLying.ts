import type {
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";

import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";

/**
 * The lie's one primitive over every channel: each second's posture is the
 * plan's own placed reader (`at`), whatever is written beneath it.
 *
 * Part of `lieDown.plan`, which prepares it once per plan.
 *
 * @param prepared What the plan prepared for it.
 * @returns The plan's `lying`.
 */
export function lieDownLying(
  prepared: lieDownLying.IPrepared,
): IAutoMovieMotionHumanPrimitive {
  const { duration, at }: lieDownLying.IPrepared = prepared;
  return {
    channels: [
      "root",
      "trunk",
      "head",
      "leftLeg",
      "rightLeg",
      "leftArm",
      "rightArm",
    ],
    reads: [],
    from: 0,
    to: duration,
    write: (
      _: IAutoMovieMotionHumanPosture,
      seconds: number,
      _before?: IAutoMovieMotionHumanPrimitive.Reader,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: ReturnType<typeof prepareHumanPostureProjection>,
    ): IAutoMovieMotionHumanPosture => at(seconds, resolution, projection),
  };
}

/** The `lying` of `lieDown.plan`, built from what that plan prepared. */
export namespace lieDownLying {
  /** What `lieDown.plan` prepared for its `lying`. */
  export interface IPrepared {
    /** The `duration` `lieDown.plan` prepared. */
    duration: number;

    /** The `at` `lieDown.plan` prepared. */
    at: (
      seconds: number,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: ReturnType<typeof prepareHumanPostureProjection>,
    ) => IAutoMovieMotionHumanPosture;
  }
}
