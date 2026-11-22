import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanChannel,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import type { StrikingWeapon } from "./StrikingWeapon";

/**
 * Fit one actual striking course and read its fixed limb endpoint bones.
 * The fixed requested-name reader is the caller's, prepared once with its
 * plan's chain (`StrikingWeapon.frames`), or prepared for this call alone;
 * each pose, course evaluation, genuine unchanged-table ROM loan and exact FK workspace belongs to this call.
 *
 * @param body The unchanged canonical body, reusable across actors only as rig metadata.
 * @param course The actual current action's free course.
 * @param seconds Its exact film second under the consumer's current context.
 * @param requested One of StrikingWeapon's four private immutable limb output sets.
 * @param channels Optional proven observational course demand, omitted for arms.
 * @param near Each limb's fit of a neighbouring second of the same course to continue (`StrikingWeaponTable`); absent, every limb is solved cold. A continued resolve fits every limb, as the resolver's own rule for a continuation asks.
 * @param kept Receives the seeds this second's fits were chosen at, for the next second's continuation.
 * @param prepared The requested set's endpoint reader the plan prepared for its chain; prepared here when absent.
 * @returns Fresh actual endpoint bone frames at this invocation's pose.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes fixed body/name metadata from changing course/time/actor context, with fresh bone output and synchronous reader ownership.
 * @evidence contracts/development/implementation.md#principled-implementation The original seeded resolver still fits the actual course with conservative requested-leg dependencies and complete arm/rival fallback. The canonical poseBones.prepare producer binds only its real output names/topology and reads the resulting actual admitted pose.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The caller's prepared endpoint reader, or one prepared here; one local exact workspace then connects course lowering, actual posture fitting and final endpoint FK.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No pose, time, target, seed, stop state, fit or sampled endpoint is retained. Every current authored joint/digit/needed fit and unsupported-context fallback still executes; arms keep the complete course and coupled clearance.
 * @evidence contracts/development/implementation.md#efficient-algorithms A plan prepares each limb's fixed name set once for its chain (`StrikingWeapon.frames`), so its contact scans pay the canonical sorting/demand preparation once; a cold call pays it itself. Every call retains its actual course/physical fit/admission and requested FK ancestry with fresh maps.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Only the plan-owned reader of one fixed requested set is shared, across that plan's seconds; course, channels, actor, seconds and stops determine the separately evaluated pose and cannot share answers or workspaces across calls.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader belongs to the plan that prepared it and is released with it; no module store holds it. Each call lazily owns one genuine ROM mapper only within its unchanged-table course/final-fit operation; it releases that mapper and its local workspace/pose on return or throw, and outputs own fresh frames.
 */
export function StrikingWeaponBones(
  body: IAutoMovieMotionHumanBody,
  course: StrikingWeapon.Course,
  seconds: number,
  requested: ReadonlySet<AutoMovieHumanoidBone>,
  channels?: readonly AutoMovieMotionHumanChannel[],
  near?: IAutoMovieMotionHumanResolveHumanPosture.INear,
  kept?: (seeds: IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"]) => void,
  prepared?: ReturnType<typeof poseBones.prepare>,
): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
  const frames: ReturnType<typeof poseBones.prepare> = prepared ?? poseBones.prepare(body, requested);
  const resolution: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution();
  let projector: ReturnType<typeof prepareHumanPostureProjection> | undefined;
  const projection: () => ReturnType<typeof prepareHumanPostureProjection> = (): ReturnType<typeof prepareHumanPostureProjection> =>
    (projector ??= prepareHumanPostureProjection(body));
  const solved: IAutoMovieMotionHumanResolveHumanPosture.ISeeded = resolveHumanPosture.seeded(
    body, course(seconds, channels, resolution, projection), undefined, near ?? {}, resolution, requested, projection(),
  );
  kept?.(solved.seeds);
  return frames(solved.pose, resolution());
}
