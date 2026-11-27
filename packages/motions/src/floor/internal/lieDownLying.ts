import type {
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
} from "@automovie/interface";

/*
 * The lie's one primitive over every channel: each second's posture is the
 * plan's own prepared course (`at`), whatever is written beneath it.
 *
 * Part of `lieDown.plan`, which prepares it once per plan.
 * Parameter prepared: What the plan prepared for it.
 * Returns: The plan's `lying`.
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
    ): IAutoMovieMotionHumanPosture => at(seconds),
  };
}

/*
 * The `lying` of `lieDown.plan`, built from what that plan prepared.
 */
export namespace lieDownLying {
  /*
   * What `lieDown.plan` prepared for its `lying`.
   */
  export interface IPrepared {
    /*
     * The `duration` `lieDown.plan` prepared.
     */
    duration: number;

    /*
     * The lie's posture at a second.
     * Parameter seconds: Action seconds.
     * Returns: The posture.
     */
    at: (seconds: number) => IAutoMovieMotionHumanPosture;
  }
}
