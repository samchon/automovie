import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanBalance } from "../everyday/HumanBalance";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/** Actual canonical observations used during one synchronous crawl-descent solve. */
interface IReading {
  /** The current two shoulders' midpoint, world metres. */
  shoulders(posture: IHumanPosture): IAutoMovieVector3;

  /** The current two knee frames after the original complete limb/digit solve. */
  knees(posture: IHumanPosture): ReturnType<typeof poseBones>;

  /** The current complete canonical pose, for the solved arms at hands-down. */
  pose(posture: IHumanPosture): IAutoMoviePose;

  /** The current whole-body mass centre after every original goal fit, world metres. */
  centre(posture: IHumanPosture): IAutoMovieVector3;
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
 * @evidence contracts/development/implementation.md#efficient-algorithms One bounded ROM index, one exact dependency reader and two fixed name demands serve all original state-search trials; the first actual centre query prepares its native fixed mass-name reader once for later centre trials. Each trial retains O(J) current projection/fitting and only its measured FK output ancestry.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The body/rig/tables, shoulder/knee names and actual mass-profile demand stay unchanged for this synchronous search. Every new posture is resolved normally and the exact reader reuses only matching scalar prerequisites, without a candidate cache.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The solve owns one bounded projector/exact reader, two frame-name readers and at most one mass-name reader until return or throw. Only final angles/scalar state leave the caller; these readers, their closures and current maps never enter the returned time evaluator.
 */
export function prepareCrawlDownResolution(body: IHumanBody): IReading {
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
  let centre: ReturnType<typeof HumanBalance.prepareCentre> | undefined;

  /** Project and fit each actual candidate before reading its requested frames. */
  const pose: (posture: IHumanPosture) => IAutoMoviePose = (
    posture: IHumanPosture,
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
    shoulders: (posture: IHumanPosture): IAutoMovieVector3 => {
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
    knees: (posture: IHumanPosture): ReturnType<typeof poseBones> =>
      knees(pose(posture), resolution()),
    pose,
    centre: (posture: IHumanPosture): IAutoMovieVector3 => {
      centre ??= HumanBalance.prepareCentre(body);
      return centre(posture, resolution, projection);
    },
  };
}

/** The hands-down lean predicate observes only the two shoulder frames. */
const SHOULDERS: ReadonlySet<AutoMovieHumanoidBone> =
  new Set<AutoMovieHumanoidBone>(["leftUpperArm", "rightUpperArm"]);

/** The sitting-back contact predicate observes only the two knee frames. */
const KNEES: ReadonlySet<AutoMovieHumanoidBone> =
  new Set<AutoMovieHumanoidBone>(["leftLowerLeg", "rightLowerLeg"]);
