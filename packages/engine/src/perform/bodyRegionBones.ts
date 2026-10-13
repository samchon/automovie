import {
  AutoMovieBodyRegion,
  AutoMovieHumanoidBone,
} from "@automovie/interface";



/** Hips + both legs (the locomotion / stance region). */
const LOWER: readonly ["hips", "leftUpperLeg", "leftLowerLeg", "leftFoot", "leftToes", "rightUpperLeg", "rightLowerLeg", "rightFoot", "rightToes"] = [
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
const UPPER: readonly ["spine", "chest", "upperChest", "leftShoulder", "leftUpperArm", "leftLowerArm", "leftHand", "rightShoulder", "rightUpperArm", "rightLowerArm", "rightHand", "leftThumbMetacarpal", "leftThumbProximal", "leftThumbDistal", "leftIndexProximal", "leftIndexIntermediate", "leftIndexDistal", "leftMiddleProximal", "leftMiddleIntermediate", "leftMiddleDistal", "leftRingProximal", "leftRingIntermediate", "leftRingDistal", "leftLittleProximal", "leftLittleIntermediate", "leftLittleDistal", "rightThumbMetacarpal", "rightThumbProximal", "rightThumbDistal", "rightIndexProximal", "rightIndexIntermediate", "rightIndexDistal", "rightMiddleProximal", "rightMiddleIntermediate", "rightMiddleDistal", "rightRingProximal", "rightRingIntermediate", "rightRingDistal", "rightLittleProximal", "rightLittleIntermediate", "rightLittleDistal"] = [
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
const HEAD: readonly ["neck", "head", "leftEye", "rightEye", "jaw"] = [
  "neck",
  "head",
  "leftEye",
  "rightEye",
  "jaw",
] as const satisfies readonly AutoMovieHumanoidBone[];

/**
 * Read the fixed humanoid bone partition for lowerBody, upperBody and head. Face owns expression channels and returns no bones; fullBody returns their union. Fixed partition arrays are borrowed readonly values.
 *
 * @evidence contracts/common.md#principled-implementation The three lists enumerate the declared humanoid union without overlap, so compiler masking gives each narrow region disjoint bone ownership.
 * @evidence contracts/common.md#clear-and-simple-design One partition owner supplies region masks and avoids duplicate per-verb bone lists.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The partition is the actual humanoid contract, not an inferred rig-specific subset; non-humanoid content must use the declared mapping rather than a fixture exception.
 * @evidence contracts/common.md#meaningful-documentation Documents face's expression-only meaning, full-body union and readonly borrowed partition ownership.
 * @evidence contracts/performance.md#efficient-algorithms Narrow regions return fixed arrays in constant work; fullBody copies the fixed B-bone union in O(B) time and storage, and face returns a fresh empty array.
 * @evidence contracts/performance.md#reuse-equivalent-work Module partition arrays are reused by narrow-region callers; fullBody's mutable underlying array is not globally shared.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Fixed module arrays persist for module lifetime; callers must honor readonly access, while fresh union/empty arrays belong to the call with no resource handles.
 */
export const bodyRegionBones: (region: AutoMovieBodyRegion) => readonly AutoMovieHumanoidBone [ ] = (
  region: AutoMovieBodyRegion,
): readonly AutoMovieHumanoidBone[] => {
  if (region === "lowerBody") return LOWER;
  if (region === "upperBody") return UPPER;
  if (region === "head") return HEAD;
  if (region === "face") return [];
  return [...LOWER, ...UPPER, ...HEAD]; // fullBody
};
