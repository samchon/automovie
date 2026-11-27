import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanChannel,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import type { StrikingWeapon } from "./StrikingWeapon";

/**
 * Fit one actual striking course and read its fixed limb endpoint bones. The
 * fixed requested-name reader is the caller's, prepared once with its plan's
 * chain (`StrikingWeapon.frames`), or prepared for this call alone; each pose,
 * course evaluation, genuine unchanged-table ROM loan and exact FK workspace
 * belongs to this call.
 *
 * @param body The unchanged canonical body, reusable across actors only as rig
 *   metadata.
 * @param course The actual current action's free course.
 * @param seconds Its exact film second under the consumer's current context.
 * @param requested One of StrikingWeapon's four private immutable limb output
 *   sets.
 * @param channels Optional proven observational course demand, omitted for
 *   arms.
 * @param near Each limb's fit of a neighbouring second of the same course to
 *   continue (`StrikingWeaponTable`); absent, every limb is solved cold. A
 *   continued resolve fits every limb, as the resolver's own rule for a
 *   continuation asks.
 * @param kept Receives the seeds this second's fits were chosen at, for the
 *   next second's continuation.
 * @param prepared The requested set's endpoint reader the plan prepared for its
 *   chain; prepared here when absent.
 * @returns Fresh actual endpoint bone frames at this invocation's pose.
 */
export function StrikingWeaponBones(
  body: IAutoMovieMotionHumanBody,
  course: StrikingWeapon.Course,
  seconds: number,
  requested: ReadonlySet<AutoMovieHumanoidBone>,
  channels?: readonly AutoMovieMotionHumanChannel[],
  near?: IAutoMovieMotionHumanResolveHumanPosture.INear,
  kept?: (
    seeds: IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"],
  ) => void,
  prepared?: ReturnType<typeof poseBones.prepare>,
): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
  const frames: ReturnType<typeof poseBones.prepare> =
    prepared ?? poseBones.prepare(body, requested);
  const resolution: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution();
  const projector: ReturnType<typeof prepareHumanPostureProjection> =
    prepareHumanPostureProjection(body);
  const projection = (): ReturnType<typeof prepareHumanPostureProjection> =>
    projector;
  const solved: IAutoMovieMotionHumanResolveHumanPosture.ISeeded =
    resolveHumanPosture.seeded(
      body,
      course(seconds, channels, resolution, projection),
      undefined,
      near ?? {},
      resolution,
      requested,
      projection(),
    );
  kept?.(solved.seeds);
  return frames(solved.pose, resolution());
}
