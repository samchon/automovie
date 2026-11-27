import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBoneGroups } from "../../posture/internal/HumanBoneGroups";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";

/**
 * The mid-point of a posture's two ankles, read from its seeded fit
 * (`resolveHumanPostureSeeded`) through the prepared feet reader.
 *
 * Part of `dive.plan`, which prepares it once per plan.
 *
 * @param prepared What the plan prepared for it.
 * @returns The plan's `ankleMid`.
 */
export function diveAnkleMid(
  prepared: diveAnkleMid.IPrepared,
): (
  posture: IAutoMovieMotionHumanPosture,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
) => IAutoMovieVector3 {
  const { readAnkles, body }: diveAnkleMid.IPrepared = prepared;
  return (
    posture: IAutoMovieMotionHumanPosture,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: Parameters<typeof resolveHumanPosture.seeded>[6],
  ): IAutoMovieVector3 => {
    const read: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(resolution);
    const bones: ReturnType<typeof poseBones> = readAnkles(
      resolveHumanPosture.seeded(
        body,
        posture,
        undefined,
        undefined,
        read,
        HumanBoneGroups.FEET,
        projection,
      ).pose,
      read(),
    );
    const l: IAutoMovieVector3 = bones.get("leftFoot")!.worldPosition;
    const r: IAutoMovieVector3 = bones.get("rightFoot")!.worldPosition;
    return { x: (l.x + r.x) / 2, y: (l.y + r.y) / 2, z: (l.z + r.z) / 2 };
  };
}

/** The `ankleMid` of `dive.plan`, built from what that plan prepared. */
export namespace diveAnkleMid {
  /** What `dive.plan` prepared for its `ankleMid`. */
  export interface IPrepared {
    /** The `readAnkles` `dive.plan` prepared. */
    readAnkles: ReturnType<typeof poseBones.prepare>;

    /** The `body` `dive.plan` prepared. */
    body: IAutoMovieMotionHumanBody;
  }
}
