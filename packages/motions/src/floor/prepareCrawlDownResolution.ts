import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/** Actual canonical observations used during one synchronous crawl-descent solve. */
interface IReading {
  /** The current two shoulders' midpoint, world metres. */
  shoulders(posture: IAutoMovieMotionHumanPosture): IAutoMovieVector3;

  /** The current two knee frames after the original complete limb/digit solve. */
  knees(posture: IAutoMovieMotionHumanPosture): ReturnType<typeof poseBones>;

  /** The current complete canonical pose, for the solved arms at hands-down. */
  pose(posture: IAutoMovieMotionHumanPosture): IAutoMoviePose;

}

/**
 * Prepare fixed ROM and FK metadata for one crawl-descent state search.
 * The caller releases these readers when that synchronous search ends;
 * each posture still undergoes complete canonical projection and fitting.
 *
 * @param body The unchanged body of the descent.
 * @returns Actual shoulder, knee, full-pose and mass-centre readers for current candidates.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States unchanged-body scope, synchronous lifetime, full current canonical solving and actual shoulder, knee, canonical-pose and mass-centre observations.
 * @evidence contracts/development/implementation.md#principled-implementation The original seeded resolver projects/fits every current joint/goal using a genuine same-body ROM metadata loan; canonical poseBones supplies the same measured shoulder/knee frames with their original ancestors.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One current-pose owner feeds two fixed demanded-name readers and final full-pose observation; HumanBalance retains mass-centre ownership while borrowing the same synchronous metadata.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No limb/digit goal, range bound, root, search candidate or contact is omitted; requested sets narrow only final FK outputs after complete resolution, and no pose result is stored.
 * @evidence contracts/development/implementation.md#efficient-algorithms One ROM index and two fixed FK demands serve all actual shoulder and knee trials.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Body, shoulder and knee demands are shared across actual contact poses.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The projector and two scoped frame readers are released with the descent plan.
 */
export function prepareCrawlDownResolution(body: IAutoMovieMotionHumanBody): IReading {
  const resolution: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution();
  const projection: ReturnType<typeof prepareHumanPostureProjection> =
    prepareHumanPostureProjection(body);
  const shoulders: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
    body,
    SHOULDERS,
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
    knees: (posture: IAutoMovieMotionHumanPosture): ReturnType<typeof poseBones> =>
      knees(pose(posture), resolution()),
    pose,
  };
}

/** The hands-down lean predicate observes only the two shoulder frames. */
const SHOULDERS: ReadonlySet<AutoMovieHumanoidBone> =
  new Set<AutoMovieHumanoidBone>(["leftUpperArm", "rightUpperArm"]);

/** The sitting-back contact predicate observes only the two knee frames. */
const KNEES: ReadonlySet<AutoMovieHumanoidBone> =
  new Set<AutoMovieHumanoidBone>(["leftLowerLeg", "rightLowerLeg"]);
