import {
  indexSkeletonTopology,
  measureAutoMovieHumanoidBody,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMoviePhysicalProfile,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "./IHumanBody";

/**
 * Derive a performer's body from a canonical rig and profile.
 *
 * @param skeleton The canonical rig.
 * @param profile Its physical profile.
 * @returns The body with its measure, surfaces, topology and rest joints.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is derived and the frame premise.
 * @evidence contracts/development/implementation.md#principled-implementation Delegates to the engine's measurer, surface resolver and topology index, and sums rest translations for rest positions.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Four derivations in sequence.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A rig or profile lacking a needed bone throws inside the engine owners.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in bones and colliders, once per body.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The derived data is shared by every action of the performer.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns plain data and retains nothing.
 */
export function createHumanBody(
  skeleton: IAutoMovieSkeleton,
  profile: IAutoMoviePhysicalProfile,
): IHumanBody {
  const rest: Map<AutoMovieHumanoidBone, IAutoMovieVector3> = new Map();
  for (const bone of skeleton.bones as IAutoMovieBone[])
    rest.set(bone.bone, {
      x:
        (bone.parent === null ? 0 : rest.get(bone.parent)!.x) +
        bone.rest.translation.x,
      y:
        (bone.parent === null ? 0 : rest.get(bone.parent)!.y) +
        bone.rest.translation.y,
      z:
        (bone.parent === null ? 0 : rest.get(bone.parent)!.z) +
        bone.rest.translation.z,
    });
  return {
    skeleton,
    profile,
    measure: measureAutoMovieHumanoidBody(skeleton, profile),
    surfaces: resolveAutoMovieHumanoidSurfaces(skeleton, profile),
    topology: indexSkeletonTopology(skeleton),
    rest,
  };
}
