import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  attachPhysicalProfileHulls,
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
  IAutoMovieMotionHumanPosture,
  IAutoMoviePhysicalProfile,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { standRelaxed } from "../actions/standRelaxed";
import { standUpright } from "../actions/standUpright";
import { AutoMovieMotionHumanAuditTangleModel } from "../audit/AutoMovieMotionHumanAuditTangleModel";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { bendFloorThumb } from "../everyday/bendFloorThumb";
import { HumanColliderPlacement } from "../posture/HumanColliderPlacement";
import { humanLimbReads } from "../posture/humanLimbReads";
import { humanSettledJoints } from "../posture/humanSettledJoints";

/** Prepare the rig data shared by a performer's motion laws. */
export namespace AutoMovieMotionHumanBody {
  /**
   * Derive a performer's body from a canonical rig and profile.
   *
   * @param skeleton The canonical rig.
   * @param profile Its physical profile.
   * @returns The body with its measure, surfaces, topology, rest joints, bone
   *   records by name, immutable canonical FK preparation, bone-local mass
   *   model and the bones its colliders ride, and its solved properties: each
   *   side's unloaded hanging arm, the quiet-stance alignment, the relaxed
   *   hanging arms, the tangle model and each flat hand's thumb twist, all made
   *   here once and only read after. Recreate it after editing the input rig or
   *   profile.
   */
  export function create(
    skeleton: IAutoMovieSkeleton,
    profile: IAutoMoviePhysicalProfile,
  ): IAutoMovieMotionHumanBody {
    const rest: Map<AutoMovieHumanoidBone, IAutoMovieVector3> = new Map();
    for (const bone of skeleton.bones)
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
    const massModel: IAutoMovieMotionHumanBody["massModel"] =
      resolveAutoMovieCenterOfMass.fromRig(poseResolution, profile);

    // The colliders at rest, mirrored left from right once here, and the bones
    // they ride, read off the rig, its rest joints and the profile alone.
    const hulled: IAutoMoviePhysicalProfile =
      attachPhysicalProfileHulls(profile);
    const colliders: IAutoMovieMotionHumanBody["colliders"] =
      HumanColliderPlacement.neutral({ skeleton, profile: hulled, rest });
    const colliderBones: IAutoMovieMotionHumanBody["colliderBones"] =
      poseResolution.prepareBones(colliders.bones);
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieBone> = new Map();
    for (const record of skeleton.bones)
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
      hanging,
      flatThumb,
    }: Pick<
      IAutoMovieMotionHumanBody,
      CreateHumanBodySolved
    >): IAutoMovieMotionHumanBody => ({
      skeleton,
      profile: hulled,
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
      colliderBones,
      colliders,
      massModel,
      upright,
      relaxed,
      rest,
      bones,
      hanging,
      flatThumb,
    });

    // The body's solved properties, each solved here once on the record of the
    // ones before it: the unloaded hanging arms on the rig's own rest, then the
    // quiet stance's alignment on the rig's rest column, the relaxed hanging
    // arms on the aligned stance, the tangle model on the solved stance, and
    // each flat hand's thumb twist. No solve reads what is solved after it.
    const unsolved: Pick<IAutoMovieMotionHumanBody, CreateHumanBodySolved> = {
      upright: REST_COLUMN,
      relaxed: stand.RELAXED,
      tangle: UNTANGLED,
      hanging: UNHUNG,
      flatThumb: UNTURNED,
    };
    const unhung: IAutoMovieMotionHumanBody = record(unsolved);
    const hanging: IAutoMovieMotionHumanBody["hanging"] = {
      left: AutoMovieMotionHumanBend.hanging(unhung, "left"),
      right: AutoMovieMotionHumanBend.hanging(unhung, "right"),
    };
    const upright: IAutoMovieMotionHumanBody["upright"] = standUpright.align(
      record({ ...unsolved, hanging }),
    );
    const relaxed: IAutoMovieMotionHumanBody["relaxed"] = standRelaxed.solve(
      record({ ...unsolved, hanging, upright }),
    );
    const tangle: IAutoMovieMotionHumanBody["tangle"] =
      AutoMovieMotionHumanAuditTangleModel.build(
        record({ ...unsolved, hanging, upright, relaxed }),
      );
    const thumbless: IAutoMovieMotionHumanBody = record({
      ...unsolved,
      hanging,
      upright,
      relaxed,
      tangle,
    });
    const flatThumb: IAutoMovieMotionHumanBody["flatThumb"] = {
      left: bendFloorThumb(thumbless, ORIGIN_POSTURE, "left"),
      right: bendFloorThumb(thumbless, ORIGIN_POSTURE, "right"),
    };
    return record({ upright, relaxed, tangle, hanging, flatThumb });
  }
}

/** The alternatives of `CreateHumanBody`'s site. */
type CreateHumanBody = "measure" | "surfaces";

/** The body's fields solved in stages from the records before them. */
type CreateHumanBodySolved =
  | "upright"
  | "relaxed"
  | "tangle"
  | "hanging"
  | "flatThumb";

/**
 * The flat thumbs' twists before they are solved. Their own solve
 * (`bendFloorThumb`) reads none.
 */
const UNTURNED: IAutoMovieMotionHumanBody["flatThumb"] = {
  left: 0,
  right: 0,
};

/**
 * A posture at the origin the flat thumbs are solved in: the thumb's clearance
 * reads only the hand's own frame.
 */
const ORIGIN_POSTURE: IAutoMovieMotionHumanPosture = {
  root: { x: 0, y: 0, z: 0 },
  yaw: 0,
  pitch: 0,
  roll: 0,
  joints: {},
  limbs: {},
};

/**
 * The hanging arms before they are solved. Their own solve
 * (`AutoMovieMotionHumanBend.hanging`) reads none.
 */
const UNHUNG: IAutoMovieMotionHumanBody["hanging"] = {
  left: null,
  right: null,
};

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
