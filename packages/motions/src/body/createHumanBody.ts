import {
  indexSkeletonTopology,
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  prepareSkeletonPoseResolution,
  measureAutoMovieHumanoidBody,
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
 * @returns The body with its measure, surfaces, topology, rest joints and immutable canonical FK preparation. The bone-local mass model, collider placement and hull faces are prepared by their actual first queries. Recreate it after editing the input rig or profile.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is derived and the frame premise.
 * @evidence contracts/development/implementation.md#principled-implementation Delegates to the engine's measurer, surface resolver, topology index, immutable FK producer with canonical axes/rest frames and segmental mass-model resolver, and sums rest translations for rest positions.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Preserves rest-position, measure, surface and topology derivation order. The engine's withSurfaces producer lends one call-scoped neutral-bounds owner across the two consecutive derivations and releases it in finally. Immutable FK follows; a body getter prepares mass on first read, and collider owners prepare only actual query needs.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A rig or profile lacking a needed bone throws inside the engine owners.
 * @evidence contracts/development/implementation.md#efficient-algorithms Fixed segment bounds, including hull vertex rotations, compute at their original first observation in measurement and serve subsequent surface bounds without repeating them. Unobserved mass performs no extra rest FK, and hull-face search remains lazy at actual collider queries. Runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work withSurfaces shares actual neutral bounds only across this unchanged synchronous profile derivation; both existing owners keep their original observations/refusals. The same topology/static FK serve action reads, and plans share one successful lazy mass model. Failed getter reads are not remembered; rig/profile edits require a new body.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources withSurfaces releases its temporary geometry owner in finally before returning independent measure/surfaces. The body owns O(B) static FK and first-read mass data; its getter retains only source inputs/one successful model. FK uses weak operation keys and collider geometry uses weak body/point keys; all release with those owners.
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
  const { measure, surfaces }: Pick<IHumanBody, "measure" | "surfaces"> =
    measureAutoMovieHumanoidBody.withSurfaces(skeleton, profile);
  const topology: IHumanBody["topology"] = indexSkeletonTopology(skeleton);
  let massModel: IHumanBody["massModel"] | undefined;
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
    get massModel(): IHumanBody["massModel"] {
      massModel ??= resolveAutoMovieCenterOfMass(skeleton, profile);
      return massModel;
    },
    rest,
  };
  return body;
}
