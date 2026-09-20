import { AutoMovieHumanoidBone } from "@automovie/interface";

/**
 * The OpenPose-style BODY keypoint set: the load-bearing humanoid bones, minus
 * the 30 finger bones (the dimensional tail that pose-conditioned diffusion
 * does not use). A rig that omits a bone simply produces no keypoint for it.
 *
 * @evidence requirements/camera/validation.md#camera-hand-computable-geometry DEFAULT_KEYPOINT_BONES keeps camera geometry hand-computable: The OpenPose-style BODY keypoint set: the load-bearing humanoid bones, minus the 30 finger bones (the dimensional tail that pose-conditioned diffusion does not use). A rig that omits a bone simply produces no keypoint for it.
 * @evidence specifications/camera-light-and-visibility/visibility-and-image-space-observation.md#clv-computable-geometry-results DEFAULT_KEYPOINT_BONES realizes independently computable image geometry: The OpenPose-style BODY keypoint set: the load-bearing humanoid bones, minus the 30 finger bones (the dimensional tail that pose-conditioned diffusion does not use). A rig that omits a bone simply produces no keypoint for it.
 */
export const DEFAULT_KEYPOINT_BONES: readonly AutoMovieHumanoidBone[] = [
  "hips",
  "spine",
  "chest",
  "neck",
  "head",
  "leftShoulder",
  "leftUpperArm",
  "leftLowerArm",
  "leftHand",
  "rightShoulder",
  "rightUpperArm",
  "rightLowerArm",
  "rightHand",
  "leftUpperLeg",
  "leftLowerLeg",
  "leftFoot",
  "rightUpperLeg",
  "rightLowerLeg",
  "rightFoot",
];
