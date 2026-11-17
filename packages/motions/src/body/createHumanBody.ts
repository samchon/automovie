import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  clampPose,
  indexSkeletonTopology,
  measureAutoMovieHumanoidBody,
  prepareChainConstants,
  prepareSkeletonPoseResolution,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieMotionHumanBody,
  IAutoMoviePhysicalProfile,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

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
 * @evidence contracts/development/implementation.md#efficient-algorithms Fixed segment/hull bounds compute at their original measurement observation and serve surface bounds. Unobserved mass performs no rest work; first mass access borrows the genuine rig's actual neutral rest computation instead of repeating raw FK, while mass transforms/admission still run once. Hull faces remain lazy and speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work withSurfaces shares actual neutral bounds across the unchanged derivation. The privately captured genuine poseResolution supplies mass rest independently of public method/property replacement, through the same static neutral rows ordinary FK uses. Plans share one successful lazy mass model; failed reads are retried and source edits require a new body.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources withSurfaces releases its temporary geometry owner in finally before returning independent measure/surfaces. The body owns O(B) static FK and first-read mass data; its getter retains only source inputs/one successful model. FK uses weak operation keys and collider geometry uses weak body/point keys; all release with those owners.
 */
export function createHumanBody(
  skeleton: IAutoMovieSkeleton,
  profile: IAutoMoviePhysicalProfile,
): IAutoMovieMotionHumanBody {
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
  const { measure, surfaces }: Pick<IAutoMovieMotionHumanBody, "measure" | "surfaces"> =
    measureAutoMovieHumanoidBody.withSurfaces(skeleton, profile);
  const topology: IAutoMovieMotionHumanBody["topology"] = indexSkeletonTopology(skeleton);
  const poseResolution: IAutoMovieMotionHumanBody["poseResolution"] = prepareSkeletonPoseResolution(
    skeleton,
    HUMANOID_JOINT_AXES,
    HUMANOID_REST_FRAME,
    topology,
  );
  const chains: Partial<Record<keyof IAutoMovieMotionHumanBody["chains"], prepareChainConstants.IConstants>> = {};
  for (const side of ["left", "right"] as const)
    for (const [limb, upper, lower, effector] of [
      ["Arm", "UpperArm", "LowerArm", "Hand"],
      ["Leg", "UpperLeg", "LowerLeg", "Foot"],
    ] as const) {
      const constants: prepareChainConstants.IConstants | null = prepareChainConstants({
        skeleton,
        chain: {
          upper: `${side}${upper}`,
          lower: `${side}${lower}`,
          effector: `${side}${effector}`,
        },
        jointAxes: poseResolution.jointAxes,

        // The tables every limb fit of this body passes
        // (`prepareHumanLimbFit`), which the record's fit readers are for.
        restFrames: HUMANOID_REST_FRAME,
      });
      if (constants !== null) chains[`${side}${limb}`] = constants;
    }
  let massModel: IAutoMovieMotionHumanBody["massModel"] | undefined;
  const body: IAutoMovieMotionHumanBody = {
    skeleton,
    profile,
    measure,
    surfaces,
    topology,
    poseResolution,
    chains,

    // The rig's ROM projection is a constant of the body like its FK
    // prerequisites: one pose clamp on this rig, read by every consumer.
    projection: clampPose.prepare(skeleton),
    get massModel(): IAutoMovieMotionHumanBody["massModel"] {
      massModel ??= resolveAutoMovieCenterOfMass.fromRig(poseResolution, profile);
      return massModel;
    },
    rest,
  };
  return body;
}
