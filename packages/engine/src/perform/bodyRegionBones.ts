import { AutoMovieBodyRegion, AutoMovieHumanoidBone } from "@automovie/interface";

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

/**
 * The humanoid bones a {@link AutoMovieBodyRegion} owns. The regions partition
 * the skeleton **disjointly and completely** (`lowerBody ∪ upperBody ∪ head` =
 * every bone the union declares, checked by the builder through
 * {@link AUTOMOVIE_RIG_IS_PARTITIONED}; `face` owns no bones, being
 * expression/morph channels; `fullBody` owns every bone). This is what lets the
 * performance builder mask clips predictably. Layering then compares the
 * content that survives these masks: clips may run concurrently whenever no
 * root, bone, or expression channel is claimed twice, even when one uses the
 * broad `fullBody` mask.
 *
 * The result is `readonly` because three of the five branches hand back the
 * module's own array rather than a copy. Typed mutable, a caller could have
 * pushed into the engine's partition and changed masking for every later shot.
 *
 * @evidence requirements/motion/layers-blends-and-transitions.md#motion-layer-mask-weight Resolves each authored body-region mask to the precise bone channels it controls.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-layer-mask-transition-composition Implements named region masks as deterministic channel sets for composition.
 * @author Samchon
 */
export const bodyRegionBones = (
  region: AutoMovieBodyRegion,
): readonly AutoMovieHumanoidBone[] => {
  if (region === "lowerBody") return LOWER;
  if (region === "upperBody") return UPPER;
  if (region === "head") return HEAD;
  if (region === "face") return [];
  return [...LOWER, ...UPPER, ...HEAD]; // fullBody
};
