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

/** The alternatives of `CreateHumanBody`'s site. */
type CreateHumanBody = "measure" | "surfaces";

/**
 * Derive a performer's body from a canonical rig and profile.
 *
 * @param skeleton The canonical rig.
 * @param profile Its physical profile.
 * @returns The body with its measure, surfaces, topology, rest joints, bone
 *   records by name and immutable canonical FK preparation. The bone-local mass
 *   model, the quiet-stance alignment, collider placement, hull faces and each
 *   side's hanging arm are prepared by their actual first queries. Recreate it
 *   after editing the input rig or profile.
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
  BEND_MEASURE.set(body, measure);
  return body;
}

/** Reader identities supplied at construction, owned by the body itself. */
const NATIVE_READERS: WeakMap<IAutoMovieMotionHumanBody, readonly IReader[]> =
  new WeakMap();
/** The factory's original measurement object for pure Bend scoring. */
const BEND_MEASURE: WeakMap<
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanBody["measure"]
> = new WeakMap();
/** One original own property read by the native actor. */
interface IReader {
  source: object;
  key: string;
  value: unknown;
}
/** Identify bodies whose factory-installed readers can be used by native motion. */
export namespace createHumanBody {
  /**
   * Whether this body's original FK, projection, hanging and limb readers are
   * still installed.
   */
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

  /**
   * Read the two current scalar measures the ordinary Bend candidate scorer
   * uses.
   */
  export function bendMeasure(
    body: IAutoMovieMotionHumanBody,
  ): readonly [number, number] | undefined {
    if (!owns(body)) return undefined;
    const original: IAutoMovieMotionHumanBody["measure"] | undefined =
      BEND_MEASURE.get(body);
    if (
      original === undefined ||
      Object.getOwnPropertyDescriptor(body, "measure")?.value !== original
    )
      return undefined;
    const length: unknown = Object.getOwnPropertyDescriptor(
      original,
      "upperArm",
    )?.value;
    const radius: unknown = Object.getOwnPropertyDescriptor(
      original,
      "forearmRadius",
    )?.value;
    return typeof length === "number" &&
      Number.isFinite(length) &&
      typeof radius === "number" &&
      Number.isFinite(radius)
      ? [length, radius]
      : undefined;
  }
}
