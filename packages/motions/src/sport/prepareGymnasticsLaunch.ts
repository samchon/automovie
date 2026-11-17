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
 * @returns A reader of an actual ballistic plan and its launch second, returning world-metre COM and velocity in metres per second.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States fixed body/model lifetime, actual query plan/time, two-sample premise, output units and separation from a launch trajectory or result cache.
 * @evidence contracts/development/implementation.md#principled-implementation Retains c(delta), c(2delta) with delta=1e-3 and the original parabola identities v=(c(2delta)-c(delta))/delta+3gdelta/2 and c0=c(delta)-vdelta+gdelta²/2. Each centre comes from its actual fully resolved raw plan posture and the unchanged engine segment reduction.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Preserve raw-plan evaluation, model-demand selection, actual solve and FK admission order; lazily bind that genuine fixed-name demand after the first solve. Each launch owns one FK source/projector, reads its two original centres and applies the same velocity/centre formulas.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No requested velocity, previous plan, rounded time, achieved target or synthetic pose supplies an observation. Complete clinical/goal/digit admission, both milliseconds and gravity arithmetic remain unchanged.
 * @evidence contracts/development/implementation.md#efficient-algorithms One bounded name lookup/sort serves all launch readings in a take-off correction operation. Each still performs two actual raw evaluations, complete canonical solves, demanded FK and O(S) mass reductions; no sample is removed and speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Only unchanged body/model bone membership is prepared across plans. Each launch's explicit synchronous FK/projector loans share exact prerequisites/static ROM metadata between its two changing sources and COM reads, while every current joint/demand is still evaluated.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The prepared reader retains body/model and at most one bounded genuine demand, never a pose, plan, centre, time or query history. Each call's FK/projector loans and local observer end on return/throw; only fresh centre/velocity vectors escape.
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
    const observe: (at: number) => IAutoMovieVector3 = (at: number): IAutoMovieVector3 => {
      const raw: IAutoMovieMotionHumanPosture = plan.posture(at, undefined, resolution, projection);
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
        body, raw, undefined, undefined, resolution, undefined, projection,
      ).pose;
      if (readBones === undefined) readBones = poseBones.prepare(body, requested!);
      return resolveAutoMovieCenterOfMass.place(
        model, readBones(pose, resolution()),
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

/** The two numeric observations of one actual ballistic launch, with no retained pose or workspace. */
interface ILaunch {
  /** Centre at the requested launch second, world metres. */
  centre: IAutoMovieVector3;

  /** Measured launch velocity, metres per second. */
  velocity: IAutoMovieVector3;
}
