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

/**
 * One performer's sampled displayed bones as the solver takes them: the
 * profile the window solves, its hands welded with their fingers at the
 * first step (`weldHumanSimulationProfile`), and each step's segment frames
 * inside that profile's joints (`admitHumanSimulationTargets`).
 *
 * @param body The performer's body.
 * @param bones The displayed bones at each step of the window.
 * @returns The solved profile and the targets by step.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is welded, at which step, and how the targets are admitted.
 * @evidence contracts/development/implementation.md#principled-implementation A segment's frame is its bone's world frame (`bindPhysicalWorld` places each rigid body at its bone's origin); the weld and the admission own their rules.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Reads the segment frames, welds once, admits each step.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every segment of the body's profile is read; nothing is dropped before the weld.
 * @evidence contracts/development/implementation.md#efficient-algorithms O(S * B) for S steps and B bones.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading of its arguments.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh frames and profile; retains nothing.
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
    displayed[0]!,
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

/** Companion types of {@link sampleHumanSimulationTargets}. */
export namespace sampleHumanSimulationTargets {
  /** The profile a window solves for a performer and its targets. */
  export interface IResult {
    /** The body's profile with its hands welded with their fingers. */
    profile: IAutoMoviePhysicalProfile;

    /** The world segment frames the solver tracks, by step. */
    targets: Record<string, IAutoMovieRigidTransform>[];
  }
}
