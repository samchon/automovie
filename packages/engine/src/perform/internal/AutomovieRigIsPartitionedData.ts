import type { AutoMovieHumanoidBone } from "@automovie/interface";

export namespace AutomovieRigIsPartitionedData {
  /*
   * Hips + both legs (the locomotion / stance region).
   */
  export const LOWER = [
    "hips",
    "leftUpperLeg",
    "leftLowerLeg",
    "leftFoot",
    "leftToes",
    "rightUpperLeg",
    "rightLowerLeg",
    "rightFoot",
    "rightToes",
  ] as const satisfies readonly AutoMovieHumanoidBone[];

  /*
   * Spine/chest + both arms + every finger (the gesture / reach region).
   */
  export const UPPER = [
    "spine",
    "chest",
    "upperChest",
    "leftShoulder",
    "leftUpperArm",
    "leftLowerArm",
    "leftHand",
    "rightShoulder",
    "rightUpperArm",
    "rightLowerArm",
    "rightHand",
    "leftThumbMetacarpal",
    "leftThumbProximal",
    "leftThumbDistal",
    "leftIndexProximal",
    "leftIndexIntermediate",
    "leftIndexDistal",
    "leftMiddleProximal",
    "leftMiddleIntermediate",
    "leftMiddleDistal",
    "leftRingProximal",
    "leftRingIntermediate",
    "leftRingDistal",
    "leftLittleProximal",
    "leftLittleIntermediate",
    "leftLittleDistal",
    "rightThumbMetacarpal",
    "rightThumbProximal",
    "rightThumbDistal",
    "rightIndexProximal",
    "rightIndexIntermediate",
    "rightIndexDistal",
    "rightMiddleProximal",
    "rightMiddleIntermediate",
    "rightMiddleDistal",
    "rightRingProximal",
    "rightRingIntermediate",
    "rightRingDistal",
    "rightLittleProximal",
    "rightLittleIntermediate",
    "rightLittleDistal",
  ] as const satisfies readonly AutoMovieHumanoidBone[];

  /*
   * Neck/head + eyes + jaw (the look-at region).
   */
  export const HEAD = [
    "neck",
    "head",
    "leftEye",
    "rightEye",
    "jaw",
  ] as const satisfies readonly AutoMovieHumanoidBone[];

  /*
   * The proof itself: `true` only while nothing escaped the partition.
   */
  export const RIG_IS_PARTITIONED: UnregionedBone extends never ? true : UnregionedBone =
    true;

  /*
   * A bone some region above owns.
   */
  export type RegionedBone =
    | (typeof LOWER)[number]
    | (typeof UPPER)[number]
    | (typeof HEAD)[number];

  /*
   * A bone no region owns, which must be none of them.
   *
   * The completeness claim below used to be a sentence and a literal 55, checked
   * by a scenario that compared the three arrays only with each other. A bone
   * added to AutoMovieHumanoidBone and to no region satisfied every one of
   * those assertions while every mask, `fullBody` included, silently stripped it
   * (#1400). The product contract makes that an expected change, since every
   * future rig axis is additive, so the claim is kept by the builder instead:
   * this alias resolves to `never` only while the partition is complete, and the
   * declaration under it fails the build naming the bone that escaped.
   */
  export type UnregionedBone = Exclude<AutoMovieHumanoidBone, RegionedBone>;
}
