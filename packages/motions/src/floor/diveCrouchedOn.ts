import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanTrunk } from "../compose/AutoMovieMotionHumanTrunk";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { dive } from "./dive";

/**
 * The take-off's crouch at a share: a third of the way into the dive's shape,
 * the root lowered with the legs planted on the entry's feet or on the rolled
 * feet, so the knees bend under it instead of the straight legs sinking into
 * the floor.
 *
 * Part of `dive.plan`, which prepares it once per plan.
 *
 * @param prepared What the plan prepared for it.
 * @returns The plan's `crouchedOn`.
 */
export function diveCrouchedOn(
  prepared: diveCrouchedOn.IPrepared,
): (
  share: number,
  on?: dive.Feet,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
) => IAutoMovieMotionHumanPosture {
  const {
    shape,
    ankleMid,
    ankles,
    stature,
    plant,
    body,
  }: diveCrouchedOn.IPrepared = prepared;
  return (
    share: number,
    on?: dive.Feet,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
  ): IAutoMovieMotionHumanPosture => {
    const posture: IAutoMovieMotionHumanPosture = shape(share / 3, 0);
    const local: IAutoMovieVector3 = ankleMid(posture, resolution, projection);
    const placed: IAutoMovieMotionHumanPosture = {
      ...posture,
      root: {
        x: ankles.x - local.x,
        y: ankles.y - local.y - 0.05 * stature * share,
        z: ankles.z - local.z,
      },
    };
    return on === undefined
      ? plant(placed)
      : AutoMovieMotionHumanTrunk.planted(body, placed, on, ["left", "right"]);
  };
}

/** The `crouchedOn` of `dive.plan`, built from what that plan prepared. */
export namespace diveCrouchedOn {
  /** What `dive.plan` prepared for its `crouchedOn`. */
  export interface IPrepared {
    /** The `shape` `dive.plan` prepared. */
    shape: dive.ShapeReader;

    /** The `ankleMid` `dive.plan` prepared. */
    ankleMid: (
      posture: IAutoMovieMotionHumanPosture,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
    ) => IAutoMovieVector3;

    /** The `ankles` `dive.plan` prepared. */
    ankles: IAutoMovieVector3;

    /** The `stature` `dive.plan` prepared. */
    stature: number;

    /** The `plant` `dive.plan` prepared. */
    plant: ReturnType<typeof AutoMovieMotionHumanTrunk.preparePlanted>;

    /** The `body` `dive.plan` prepared. */
    body: IAutoMovieMotionHumanBody;
  }
}
