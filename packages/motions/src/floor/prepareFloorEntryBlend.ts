import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { knockdown } from "../reaction/knockdown";
import { floorEntryHips } from "./floorEntryHips";
import { floorEntryJoints } from "./floorEntryJoints";

/**
 * Prepare a transition whose two raw endpoints are explicitly unchanged.
 * Generic borrowed-entry transitions use floorEntry.blend at each query.
 *
 * @param body The unchanged canonical body/profile.
 * @param from The caller-owned fixed departure posture.
 * @param to The caller-owned fixed arrival posture.
 * @returns A current-weight writer borrowing optional FK/ROM only for its synchronous observation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the explicit fixed-endpoint/body contract, degree/metre interpolation, lazy observations and current-call metadata lifetime.
 * @evidence contracts/development/implementation.md#principled-implementation Uses the original clinical joint, shortest-yaw, hip-carried root and floor-penetration interpolation; native joint/hip/heading/floor owners retain their original formulas.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Fixed joint pairs/yaw precede a lazy endpoint geometry record; every actual interior read independently constructs its current shape and floor bound. Generic raw facades never delegate here automatically.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The fixed-source premise applies only to explicit callers; no borrowed entry, arbitrary weight callback, raw endpoint guard or raw getter/throw schedule is silently frozen. Contact bounds, complete fits and exact endpoint identity remain.
 * @evidence contracts/development/implementation.md#efficient-algorithms Fixed pairs/hip coefficients and endpoint floor bounds prepare once, and native collider selection binds only on first floor demand. Each interior read retains current joint interpolation, current floor placement/bounds and native live metadata checks, with unmeasured speedup.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Only unchanged endpoints/body/profile establish fixed work; current weight, shape, fit and floor reading remain independently evaluated with optional same-query FK/ROM loans.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The explicit caller owns endpoint pairs, two floor scalars, one fixed hip reader and at most one native collider reader until release. Current FK/ROM, posed maps and outputs never enter retained metadata or history.
 */
export function prepareFloorEntryBlend(
  body: IAutoMovieMotionHumanBody,
  from: IAutoMovieMotionHumanPosture,
  to: IAutoMovieMotionHumanPosture,
): (
  weight: number,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  projection?: ReturnType<typeof prepareHumanPostureProjection>,
) => IAutoMovieMotionHumanPosture {
  const interpolate: ReturnType<typeof floorEntryJoints.prepare> = floorEntryJoints.prepare(from.joints, to.joints);
  const turn: number = ((((to.yaw - from.yaw) % 360) + 540) % 360) - 180;
  let floor: ReturnType<typeof knockdown.prepareRest> | undefined;
  let fixed: { hips: ReturnType<typeof Vector3.prepareLerp>; sunkFrom: number; sunkTo: number } | undefined;
  return (
    weight: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IAutoMovieMotionHumanPosture => {
    if (weight <= 0) return from;
    if (weight >= 1) return to;
    const read: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution(resolution);
    const project: ReturnType<typeof prepareHumanPostureProjection> = projection ?? prepareHumanPostureProjection(body);
    const sunk: (posture: IAutoMovieMotionHumanPosture) => number = (posture: IAutoMovieMotionHumanPosture): number => {
      floor ??= knockdown.prepareRest(body);
      return Math.max(0, floor(posture, read, project) - posture.root.y);
    };
    fixed ??= {
      hips: Vector3.prepareLerp(floorEntryHips(body, from), floorEntryHips(body, to)),
      sunkFrom: sunk(from),
      sunkTo: sunk(to),
    };
    const lerp: (a: number, b: number) => number = (a: number, b: number): number => a + (b - a) * weight;
    const joints: IAutoMovieMotionHumanPosture["joints"] = interpolate(weight);
    const heading: Pick<IAutoMovieMotionHumanPosture, "yaw" | "pitch" | "roll"> = {
      yaw: from.yaw + turn * weight,
      pitch: lerp(from.pitch, to.pitch),
      roll: lerp(from.roll, to.roll),
    };
    const carried: IAutoMovieMotionHumanPosture = {
      ...heading,
      root: Vector3.subtract(fixed.hips(weight), Quaternion.rotateVector(resolveHumanPosture.heading(heading), body.rest.get("hips")!)),
      joints,
      limbs: {},
    };
    const rise: number = Math.max(0, sunk(carried) - lerp(fixed.sunkFrom, fixed.sunkTo));
    return rise === 0 ? carried : { ...carried, root: { ...carried.root, y: carried.root.y + rise } };
  };
}
