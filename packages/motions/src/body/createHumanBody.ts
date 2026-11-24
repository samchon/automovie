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

import { stand } from "../actions/stand";
import { standRelaxed } from "../actions/standRelaxed";
import { standUpright } from "../actions/standUpright";
import { AutoMovieMotionHumanAuditTangleModel } from "../audit/AutoMovieMotionHumanAuditTangleModel";
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
 *   records by name, immutable canonical FK preparation, the quiet-stance
 *   alignment and the relaxed hanging arms, both solved here. The bone-local
 *   mass model, collider placement, hull faces and each side's hanging arm are
 *   prepared by their actual first queries. Recreate it after editing the input
 *   rig or profile.
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
  let colliderBones: IAutoMovieMotionHumanBody["colliderBones"] | undefined;
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieBone> = new Map();
  for (const record of skeleton.bones as IAutoMovieBone[])
    if (!bones.has(record.bone)) bones.set(record.bone, record);
  const projection: IAutoMovieMotionHumanBody["projection"] =
    clampPose.prepare(skeleton);
  const settled: IAutoMovieMotionHumanBody["settled"] =
    humanSettledJoints(skeleton);
  const reads: IAutoMovieMotionHumanBody["reads"] = humanLimbReads(
    skeleton,
    poseResolution,
    chains,
  );
  const record = ({
    upright,
    relaxed,
    tangle,
  }: Pick<IAutoMovieMotionHumanBody, CreateHumanBodySolved>): IAutoMovieMotionHumanBody => {
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
      projection,
      settled,

      // What each limb's fit reads of a pose is a value of the rig too.
      reads,
      tangle,
      get colliderBones(): IAutoMovieMotionHumanBody["colliderBones"] {
        colliderBones ??= poseResolution.prepareBones(
          HumanColliders.bones(body),
        );
        return colliderBones;
      },
      get massModel(): IAutoMovieMotionHumanBody["massModel"] {
        massModel ??= resolveAutoMovieCenterOfMass.fromRig(
          poseResolution,
          profile,
        );
        return massModel;
      },
      upright,
      relaxed,
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
  };

  // Quiet standing is a property of the body, solved here once: the alignment
  // on the rig's rest column, then the relaxed hanging arms on the aligned
  // stance, then the tangle model on the solved stance, each solve reading
  // only the record it is given and none reading what is solved after it.
  const unsolved: Pick<IAutoMovieMotionHumanBody, CreateHumanBodySolved> = {
    upright: REST_COLUMN,
    relaxed: stand.RELAXED,
    tangle: UNTANGLED,
  };
  const upright: IAutoMovieMotionHumanBody["upright"] = standUpright.align(
    record(unsolved),
  );
  const relaxed: IAutoMovieMotionHumanBody["relaxed"] = standRelaxed.solve(
    record({ ...unsolved, upright }),
  );
  const tangle: IAutoMovieMotionHumanBody["tangle"] =
    AutoMovieMotionHumanAuditTangleModel.build(
      record({ ...unsolved, upright, relaxed }),
    );
  return record({ upright, relaxed, tangle });
}

/** The body's fields solved in stages from the records before them. */
type CreateHumanBodySolved = "upright" | "relaxed" | "tangle";

/**
 * The tangle model before it is built: no segment. No solve before the model's
 * own reads a body's tangle model (`AutoMovieMotionHumanAuditTangleModel`).
 */
const UNTANGLED: IAutoMovieMotionHumanBody["tangle"] = {
  parts: [],
  related: [],
  arms: { left: [], right: [] },
  rest: [],
  stance: [],
  baseline: [],
};

/**
 * The rig's rest column, unaligned: the trunk, neck and head at their rest
 * angles and no forward lean, the record the quiet-stance alignment is solved
 * from (`standUpright.align`).
 */
const REST_COLUMN: IAutoMovieMotionHumanBody["upright"] = {
  joints: {},
  lean: 0,
};
