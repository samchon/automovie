import {
  indexSkeletonTopology,
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  prepareSkeletonPoseResolution,
  measureAutoMovieHumanoidBody,
  resolveAutoMovieHumanoidSurfaces,
  resolveAutoMovieCenterOfMass,
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
 * @returns The body with its measure, surfaces, topology, rest joints, immutable canonical FK preparation and bone-local mass model. Collider placement and hull faces are prepared by their actual first queries. Recreate it after editing the input rig or profile.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is derived and the frame premise.
 * @evidence contracts/development/implementation.md#principled-implementation Delegates to the engine's measurer, surface resolver, topology index, immutable FK producer with canonical axes/rest frames and segmental mass-model resolver, and sums rest translations for rest positions.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Preserves rest-position, measure, surface and topology derivation order, then prepares immutable FK and the body mass model. Collider owners prepare only the neutral metadata and hull geometry actual queries need.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A rig or profile lacking a needed bone throws inside the engine owners.
 * @evidence contracts/development/implementation.md#efficient-algorithms Body derivations scale with rig/profile populations once. This producer no longer eagerly searches every collider hull's faces; existing geometry owners lazily perform and retain that work only when a real query needs it. Runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The same topology feeds static FK preparation and action ancestry reads; poseBones shares the immutable rest/axes/frame snapshot, and jump/flight plans share one body mass model instead of rebuilding geometric rest per plan. Rig/profile edits require a new body.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned body owns O(B) static FK/mass data. FK dynamic rows use weak operation keys; collider placement/hull faces use weak body/point keys. All release with those owners, without external handles or tasks.
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
  const measure: IHumanBody["measure"] = measureAutoMovieHumanoidBody(skeleton, profile);
  const surfaces: IHumanBody["surfaces"] = resolveAutoMovieHumanoidSurfaces(skeleton, profile);
  const topology: IHumanBody["topology"] = indexSkeletonTopology(skeleton);
  const body: IHumanBody = {
    skeleton,
    profile,
    measure,
    surfaces,
    topology,
    poseResolution: prepareSkeletonPoseResolution(
      skeleton,
      HUMANOID_JOINT_AXES,
      HUMANOID_REST_FRAME,
      topology,
    ),
    massModel: resolveAutoMovieCenterOfMass(skeleton, profile),
    rest,
  };
  return body;
}
