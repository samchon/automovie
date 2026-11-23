import {
  AutoMovieGravity,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanColliders } from "../posture/HumanColliders";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * Prepare the fixed mass-bone demand for launch readings of one unchanged
 * body/model, while every plan and both actual millisecond samples still
 * receive their original complete resolution and mass reduction.
 *
 * @param body The unchanged canonical body.
 * @param model Its unchanged physical segment model.
 * @returns A reader of an actual ballistic plan and its launch second,
 *   returning world-metre COM and velocity in metres per second.
 */
export function prepareGymnasticsLaunch(
  body: IAutoMovieMotionHumanBody,
  model: IAutoMovieResolveCenterOfMass.IModel,
): (plan: IAutoMovieMotionHumanActionPlan, seconds: number) => ILaunch {
  let readBones: ReturnType<typeof poseBones.prepare> | undefined;
  return (plan: IAutoMovieMotionHumanActionPlan, seconds: number): ILaunch => {
    const delta: number = 1e-3;
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const projection: ReturnType<typeof prepareHumanPostureProjection> =
      prepareHumanPostureProjection(body);
    const observe: (at: number) => IAutoMovieVector3 = (
      at: number,
    ): IAutoMovieVector3 => {
      const raw: IAutoMovieMotionHumanPosture = plan.posture(
        at,
        undefined,
        resolution,
        projection,
      );
      let requested: ReadonlySet<AutoMovieHumanoidBone> | undefined;
      if (readBones === undefined) {
        if (model === body.massModel) requested = HumanColliders.bones(body);
        else {
          const massBones: Set<AutoMovieHumanoidBone> = new Set();
          for (const segment of model.segments) massBones.add(segment.bone);
          requested = massBones;
        }
      }
      const pose: IAutoMoviePose = resolveHumanPosture.seeded(
        body,
        raw,
        undefined,
        undefined,
        resolution,
        undefined,
        projection,
      ).pose;
      if (readBones === undefined)
        readBones = poseBones.prepare(body, requested!);
      return resolveAutoMovieCenterOfMass.place(
        model,
        readBones(pose, resolution()),
      );
    };
    const one: IAutoMovieVector3 = observe(seconds + delta);
    const two: IAutoMovieVector3 = observe(seconds + 2 * delta);
    const velocity: IAutoMovieVector3 = {
      x: (two.x - one.x) / delta,
      y: (two.y - one.y) / delta + 1.5 * AutoMovieGravity.STANDARD * delta,
      z: (two.z - one.z) / delta,
    };
    return {
      centre: {
        x: one.x - velocity.x * delta,
        y:
          one.y -
          velocity.y * delta +
          0.5 * AutoMovieGravity.STANDARD * delta * delta,
        z: one.z - velocity.z * delta,
      },
      velocity,
    };
  };
}

/**
 * The two numeric observations of one actual ballistic launch, with no retained
 * pose or workspace.
 */
interface ILaunch {
  /** Centre at the requested launch second, world metres. */
  centre: IAutoMovieVector3;

  /** Measured launch velocity, metres per second. */
  velocity: IAutoMovieVector3;
}
