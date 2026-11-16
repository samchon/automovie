import type { IAutoMovieResolvedBone } from "@automovie/engine";
import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { AutoMovieMotionHumanChannel } from "../compose/AutoMovieMotionHumanChannel";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import type { StrikingWeapon } from "./StrikingWeapon";

/**
 * Fit one actual striking course and read its fixed limb endpoint bones.
 * Only the canonical body's fixed requested-name preparation is retained;
 * each pose, course evaluation and exact FK workspace belongs to this call.
 *
 * @param body The unchanged canonical body, reusable across actors only as rig metadata.
 * @param course The actual current action's free course.
 * @param seconds Its exact film second under the consumer's current context.
 * @param requested One of StrikingWeapon's four private immutable limb output sets.
 * @param channels Optional proven observational course demand, omitted for arms.
 * @returns Fresh actual endpoint bone frames at this invocation's pose.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes fixed body/name metadata from changing course/time/actor context, with fresh bone output and synchronous reader ownership.
 * @evidence contracts/development/implementation.md#principled-implementation The original seeded resolver still fits the actual course with conservative requested-leg dependencies and complete arm/rival fallback. The canonical poseBones.prepare producer binds only its real output names/topology and reads the resulting actual admitted pose.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One metadata lookup prepares a genuine fixed-demand FK reader if needed; one local exact workspace then connects course lowering, actual posture fitting and final endpoint FK.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No pose, time, target, seed, stop state, fit or sampled endpoint is retained. Every current authored joint/digit/needed fit and unsupported-context fallback still executes; arms keep the complete course and coupled clearance.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each of the four current fixed limb name sets pays canonical sorting/demand preparation once per unchanged body. Every call retains its actual course/physical fit/admission and requested FK ancestry with fresh maps; speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Only canonical body metadata and a private module-owned immutable requested set determine the retained demand producer. These sets are never mutated or exposed by StrikingWeapon; course, channels, actor, seconds and stops determine the separately evaluated pose and cannot share answers or workspaces across calls.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A weak body key owns at most four current fixed-demand producers and their bounded bone-name/index metadata; no pose/source set snapshot mutation, numerical history or handles grow. Each call releases its local workspace/pose on return or throw, outputs own fresh frames, and body release permits collection of the producers.
 */
export function StrikingWeaponBones(
  body: IHumanBody,
  course: StrikingWeapon.Course,
  seconds: number,
  requested: ReadonlySet<AutoMovieHumanoidBone>,
  channels?: readonly AutoMovieMotionHumanChannel[],
): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
  let demands: Map<ReadonlySet<AutoMovieHumanoidBone>, ReturnType<typeof poseBones.prepare>> | undefined = KEPT.get(body);
  if (demands === undefined) {
    demands = new Map();
    KEPT.set(body, demands);
  }
  let frames: ReturnType<typeof poseBones.prepare> | undefined = demands.get(requested);
  if (frames === undefined) {
    frames = poseBones.prepare(body, requested);
    demands.set(requested, frames);
  }
  const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution();
  const pose: ReturnType<typeof resolveHumanPosture> = resolveHumanPosture.seeded(
    body, course(seconds, channels, resolution), undefined, {}, resolution, requested,
  ).pose;
  return frames(pose, resolution());
}

/** Only real fixed-demand producers; no current numerical pose or FK workspace. */
const KEPT: WeakMap<IHumanBody, Map<ReadonlySet<AutoMovieHumanoidBone>, ReturnType<typeof poseBones.prepare>>> = new WeakMap();
