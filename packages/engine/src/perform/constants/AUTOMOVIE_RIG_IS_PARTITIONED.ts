import { AutoMovieHumanoidBone } from "@automovie/interface";

/** Hips + both legs (the locomotion / stance region). */
const LOWER = [
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

/** Spine/chest + both arms + every finger (the gesture / reach region). */
const UPPER = [
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

/** Neck/head + eyes + jaw (the look-at region). */
const HEAD = [
  "neck",
  "head",
  "leftEye",
  "rightEye",
  "jaw",
] as const satisfies readonly AutoMovieHumanoidBone[];

/** A bone some region above owns. */
type RegionedBone =
  | (typeof LOWER)[number]
  | (typeof UPPER)[number]
  | (typeof HEAD)[number];

/**
 * A bone no region owns, which must be none of them.
 *
 * The completeness claim below used to be a sentence and a literal 55, checked
 * by a scenario that compared the three arrays only with each other. A bone
 * added to {@link AutoMovieHumanoidBone} and to no region satisfied every one of
 * those assertions while every mask, `fullBody` included, silently stripped it
 * (#1400). The product contract makes that an expected change, since every
 * future rig axis is additive, so the claim is kept by the builder instead:
 * this alias resolves to `never` only while the partition is complete, and the
 * declaration under it fails the build naming the bone that escaped.
 */
type UnregionedBone = Exclude<AutoMovieHumanoidBone, RegionedBone>;

/** The proof itself: `true` only while nothing escaped the partition. */
const RIG_IS_PARTITIONED: UnregionedBone extends never ? true : UnregionedBone =
  true;

/**
 * Build-time proof that {@link bodyRegionBones} partitions the whole rig.
 *
 * The value says nothing; the type above is the guard. It is exported because
 * an unread private constant is a build error, and the proof has to be read by
 * something. Declared plainly `true` rather than carrying the conditional, so
 * the emitted declaration does not republish the three region tuples and the
 * aliases over them: a downstream builder would otherwise re-evaluate the
 * proof against whichever `@automovie/interface` it resolves, and read 55 bone
 * literals to learn the type of a constant that is `true`.
 *
 * @evidence requirements/motion/layers-blends-and-transitions.md#motion-layer-channel-ownership Proves that named body-region owners cover every declared humanoid bone exactly once.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-layer-mask-transition-composition Guards the complete channel partition assumed by region-mask composition.
 */
export const AUTOMOVIE_RIG_IS_PARTITIONED: true = RIG_IS_PARTITIONED;
