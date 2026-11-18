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

import { standUpright } from "../actions/standUpright";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { HumanColliders } from "../posture/HumanColliders";
import { humanLimbReads } from "../posture/humanLimbReads";
import { humanSettledJoints } from "../posture/humanSettledJoints";

/**
 * Derive a performer's body from a canonical rig and profile.
 *
 * @param skeleton The canonical rig.
 * @param profile Its physical profile.
 * @returns The body with its measure, surfaces, topology, rest joints, bone records by name and immutable canonical FK preparation. The bone-local mass model, the quiet-stance alignment, collider placement, hull faces and each side's hanging arm are prepared by their actual first queries. Recreate it after editing the input rig or profile.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is derived and the frame premise.
 * @evidence contracts/development/implementation.md#principled-implementation Delegates to the engine's measurer, surface resolver, topology index, immutable FK producer with canonical axes/rest frames and segmental mass-model resolver, and sums rest translations for rest positions.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Preserves rest-position, measure, surface and topology derivation order. The engine's withSurfaces producer lends one call-scoped neutral-bounds owner across the two consecutive derivations and releases it in finally. Immutable FK follows; a body getter prepares mass on first read, and collider owners prepare only actual query needs.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A rig or profile lacking a needed bone throws inside the engine owners.
 * @evidence contracts/development/implementation.md#efficient-algorithms Fixed segment/hull bounds compute at their original measurement observation and serve surface bounds. Unobserved mass performs no rest work; first mass access borrows the genuine rig's actual neutral rest computation instead of repeating raw FK, while mass transforms/admission still run once. Hull faces remain lazy and speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work withSurfaces shares actual neutral bounds across the unchanged derivation. The privately captured genuine poseResolution supplies mass rest independently of public method/property replacement, through the same static neutral rows ordinary FK uses. Plans share one successful lazy mass model; failed reads are retried and source edits require a new body.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources withSurfaces releases its temporary geometry owner in finally before returning independent measure/surfaces. The body owns O(B) static FK, its O(B) name index, first-read mass data and at most two hanging-arm angle triples; its getter retains only source inputs/one successful model. FK uses weak operation keys and collider geometry uses weak body/point keys; all release with those owners.
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
  }: Pick<IAutoMovieMotionHumanBody, "measure" | "surfaces"> =
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
  const readers: IReader[] = [];
  for (const source of [
    poseResolution,
    body.projection,
    body.projection.joints,
  ])
    for (const [key, value] of Object.entries(source))
      if (typeof value === "function") readers.push({ source, key, value });
  for (const key of [
    "poseResolution",
    "projection",
    "hanging",
    "reads",
  ] as const)
    readers.push({ source: body, key, value: body[key] });
  readers.push({
    source: body.projection,
    key: "joints",
    value: body.projection.joints,
  });
  for (const limb of ["leftArm", "rightArm", "leftLeg", "rightLeg"] as const) {
    const pair: (typeof body.reads)[typeof limb] = body.reads[limb];
    readers.push({ source: body.reads, key: limb, value: pair });
    for (const [index, read] of pair.entries()) {
      readers.push({ source: pair, key: String(index), value: read });
      for (const key of ["bones", "requested", "demand"] as const)
        readers.push({ source: read, key, value: read[key] });
      readers.push({ source: read.demand, key: "map", value: read.demand.map });
    }
  }
  NATIVE_READERS.set(body, readers);
  return body;
}

/** Reader identities supplied at construction, owned by the body itself. */
const NATIVE_READERS: WeakMap<IAutoMovieMotionHumanBody, readonly IReader[]> =
  new WeakMap();
/** One original own property read by the native actor. */
interface IReader {
  source: object;
  key: string;
  value: unknown;
}
/**
 * Identify bodies whose factory-installed readers can be used by native motion.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the body ownership and reader identity premise.
 * @evidence contracts/development/design.md#principled-representation Each issued body indexes its original reader properties by object and key. A current descriptor must expose the same value.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The factory records ownership and exposes one predicate. Motion consumers decide whether a matching body qualifies for their own path.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Descriptor reads reject accessor replacements without invoking them. The weak index contains identities alone and releases them with their body.
 */
export namespace createHumanBody {
  /** Whether this body's original FK, projection, hanging and limb readers are still installed. */
  export function owns(body: IAutoMovieMotionHumanBody): boolean {
    const readers: readonly IReader[] | undefined = NATIVE_READERS.get(body);
    return (
      readers !== undefined &&
      readers.every(
        (reader: IReader): boolean =>
          Object.getOwnPropertyDescriptor(reader.source, reader.key)?.value ===
          reader.value,
      )
    );
  }
}
