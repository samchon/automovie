import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
} from "@automovie/interface";

import { admitHumanSimulationTargets } from "./admitHumanSimulationTargets";
import { weldHumanSimulationProfile } from "./weldHumanSimulationProfile";

/*
 * One performer's sampled displayed bones as the solver takes them: the profile
 * the window solves, welded at its neutral pose (`weldHumanSimulationProfile`:
 * the hands with their fingers, the toes, and the neck with the head), and each
 * step's segment frames inside that profile's joints
 * (`admitHumanSimulationTargets`).
 * Parameter body: The performer's body.
 * Parameter bones: The displayed bones at each step of the window.
 * Returns: The solved profile and the targets by step.
 */
export function sampleHumanSimulationTargets(
  body: IAutoMovieMotionHumanBody,
  bones: readonly Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>[],
): sampleHumanSimulationTargets.IResult {
  const carried: ReadonlySet<string> = new Set(
    body.profile.segments.map(
      (segment: IAutoMoviePhysicalSegment): string => segment.bone,
    ),
  );
  const displayed: Record<string, IAutoMovieRigidTransform>[] = bones.map(
    (
      placed: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    ): Record<string, IAutoMovieRigidTransform> =>
      Object.fromEntries(
        [...placed.values()]
          .filter((bone: IAutoMovieResolvedBone): boolean =>
            carried.has(bone.bone),
          )
          .map(
            (
              bone: IAutoMovieResolvedBone,
            ): [string, IAutoMovieRigidTransform] => [
              bone.bone,
              { position: bone.worldPosition, rotation: bone.worldRotation },
            ],
          ),
      ),
  );
  const profile: IAutoMoviePhysicalProfile = weldHumanSimulationProfile(
    body.profile,
  );
  return {
    profile,
    targets: displayed.map(
      (
        frames: Record<string, IAutoMovieRigidTransform>,
      ): Record<string, IAutoMovieRigidTransform> =>
        admitHumanSimulationTargets(profile, frames),
    ),
  };
}

/*
 * Companion types of sampleHumanSimulationTargets.
 */
export namespace sampleHumanSimulationTargets {
  /*
   * The profile a window solves for a performer and its targets.
   */
  export interface IResult {
    /*
     * The body's profile with its welds applied.
     */
    profile: IAutoMoviePhysicalProfile;

    /*
     * The world segment frames the solver tracks, by step.
     */
    targets: Record<string, IAutoMovieRigidTransform>[];
  }
}
