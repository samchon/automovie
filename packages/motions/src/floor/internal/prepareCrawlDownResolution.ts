import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBoneGroups } from "../../posture/HumanBoneGroups";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";

/**
 * Actual canonical observations used during one synchronous crawl-descent
 * solve.
 */
interface IReading {
  /** The current two shoulders' midpoint, world metres. */
  shoulders(posture: IAutoMovieMotionHumanPosture): IAutoMovieVector3;

  /** The current two knee frames after the original complete limb/digit solve. */
  knees(posture: IAutoMovieMotionHumanPosture): ReturnType<typeof poseBones>;

  /** The current complete canonical pose, for the solved arms at hands-down. */
  pose(posture: IAutoMovieMotionHumanPosture): IAutoMoviePose;
}

/**
 * Prepare fixed ROM and FK metadata for one crawl-descent state search. The
 * caller releases these readers when that synchronous search ends; each posture
 * still undergoes complete canonical projection and fitting.
 *
 * @param body The unchanged body of the descent.
 * @returns Actual shoulder, knee, full-pose and mass-centre readers for current
 *   candidates.
 */
export function prepareCrawlDownResolution(
  body: IAutoMovieMotionHumanBody,
): IReading {
  const resolution: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution();
  const projection: ReturnType<typeof prepareHumanPostureProjection> =
    prepareHumanPostureProjection(body);
  const shoulders: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
    body,
    HumanBoneGroups.SHOULDERS,
  );
  const knees: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
    body,
    KNEES,
  );

  /** Project and fit each actual candidate before reading its requested frames. */
  const pose: (posture: IAutoMovieMotionHumanPosture) => IAutoMoviePose = (
    posture: IAutoMovieMotionHumanPosture,
  ): IAutoMoviePose =>
    resolveHumanPosture.seeded(
      body,
      posture,
      undefined,
      undefined,
      resolution,
      undefined,
      projection,
    ).pose;
  return {
    shoulders: (posture: IAutoMovieMotionHumanPosture): IAutoMovieVector3 => {
      const bones: ReturnType<typeof poseBones> = shoulders(
        pose(posture),
        resolution(),
      );
      return Vector3.lerp(
        bones.get("leftUpperArm")!.worldPosition,
        bones.get("rightUpperArm")!.worldPosition,
        0.5,
      );
    },
    knees: (
      posture: IAutoMovieMotionHumanPosture,
    ): ReturnType<typeof poseBones> => knees(pose(posture), resolution()),
    pose,
  };
}

/** The sitting-back contact predicate observes only the two knee frames. */
const KNEES: ReadonlySet<AutoMovieHumanoidBone> =
  new Set<AutoMovieHumanoidBone>(["leftLowerLeg", "rightLowerLeg"]);
