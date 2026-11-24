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
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieMotionHumanBody,
  IAutoMoviePhysicalProfile,
  IAutoMovieResolvedJointAngles,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

import { standRelaxed } from "../actions/standRelaxed";
import { standUpright } from "../actions/standUpright";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { HumanColliders } from "../posture/HumanColliders";
import { humanLimbReads } from "../posture/humanLimbReads";
import { humanSettledJoints } from "../posture/humanSettledJoints";

/** The alternatives of `CreateHumanBody`'s site. */
type CreateHumanBody = "measure" | "surfaces";

/**
 * Derive a performer's body from a canonical rig and profile.
 *
 * @param skeleton The canonical rig.
 * @param profile Its physical profile.
 * @returns The body with its measure, surfaces, topology, rest joints, bone
 *   records by name and immutable canonical FK preparation. The bone-local mass
 *   model, the quiet-stance alignment, the relaxed hanging arms, collider
 *   placement, hull faces and each side's hanging arm are prepared by their
 *   actual first queries. Recreate it after editing the input rig or profile.
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
  const {
    measure,
    surfaces,
  }: Pick<IAutoMovieMotionHumanBody, CreateHumanBody> =
    measureAutoMovieHumanoidBody.withSurfaces(skeleton, profile);
  const topology: IAutoMovieMotionHumanBody["topology"] =
    indexSkeletonTopology(skeleton);
  const poseResolution: IAutoMovieMotionHumanBody["poseResolution"] =
    prepareSkeletonPoseResolution(
      skeleton,
      HUMANOID_JOINT_AXES,
      HUMANOID_REST_FRAME,
      topology,
    );
  const chains: Partial<
    Record<
      keyof IAutoMovieMotionHumanBody["chains"],
      prepareChainConstants.IConstants
    >
  > = {};
  for (const side of ["left", "right"] as const)
    for (const [limb, upper, lower, effector] of [
      ["Arm", "UpperArm", "LowerArm", "Hand"],
      ["Leg", "UpperLeg", "LowerLeg", "Foot"],
    ] as const) {
      const constants: prepareChainConstants.IConstants | null =
        prepareChainConstants({
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
  let upright: IAutoMovieMotionHumanBody["upright"] | undefined;
  let relaxed: IAutoMovieMotionHumanBody["relaxed"] | undefined;
  let colliderBones: IAutoMovieMotionHumanBody["colliderBones"] | undefined;
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieBone> = new Map();
  for (const record of skeleton.bones as IAutoMovieBone[])
    if (!bones.has(record.bone)) bones.set(record.bone, record);
  const hung: Map<AutoMovieHumanSide, IAutoMovieResolvedJointAngles | null> =
    new Map();
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
    settled: humanSettledJoints(skeleton),

    // What each limb's fit reads of a pose is a value of the rig too.
    reads: humanLimbReads(skeleton, poseResolution, chains),
    get colliderBones(): IAutoMovieMotionHumanBody["colliderBones"] {
      colliderBones ??= poseResolution.prepareBones(HumanColliders.bones(body));
      return colliderBones;
    },
    get massModel(): IAutoMovieMotionHumanBody["massModel"] {
      massModel ??= resolveAutoMovieCenterOfMass.fromRig(
        poseResolution,
        profile,
      );
      return massModel;
    },

    // Quiet standing is a property of the body: aligned on its first read.
    get upright(): IAutoMovieMotionHumanBody["upright"] {
      upright ??= standUpright.align(body);
      return upright;
    },

    // The relaxed hanging arms are a property of the body as well.
    get relaxed(): IAutoMovieMotionHumanBody["relaxed"] {
      relaxed ??= standRelaxed.solve(body);
      return relaxed;
    },
    rest,
    bones,
    hanging: (
      side: AutoMovieHumanSide,
    ): IAutoMovieResolvedJointAngles | null => {
      if (!hung.has(side))
        hung.set(side, AutoMovieMotionHumanBend.hanging(body, side));
      return hung.get(side)!;
    },
  };
  return body;
}
