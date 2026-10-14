import { AutoMovieHumanoidBone, IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanMeasurements } from "../measure/IAutoMovieHumanMeasurements";
import { IAutoMovieHumanIdentity } from "../structures/IAutoMovieHumanIdentity";
import { IAutoMovieHumanSkeleton } from "./IAutoMovieHumanSkeleton";

/**
 * Vertical distance from the acromion down to the shoulder joint centre, millimetres: de Leva's landmark-to-centre offsets give 33.7 for women and 34.5 for men (de Leva 1996, J Biomech 29(9):1223-1230); the identity carries no sex, so their mean is used. Grade: measured offset, rounded.
 */
const ACROMION_TO_SHOULDER_CENTRE: number = 34;

/**
 * Hip joint centre lateral to the midpoint of the anterior superior iliac spines as a function of leg length LL: Y = 8 + 0.086 LL millimetres, from CT in both sexes aged 5 to 40 (Hara et al. 2016, Sci Rep 6:37707). Hara's LL runs from the anterior superior iliac spine to the medial malleolus; the placeholder substitutes trochanterion height, which the identity carries. Grade: measured regression, approximated input.
 */
const HIP_LATERAL_INTERCEPT: number = 8;

/** Slope of the hip centre's lateral offset on leg length; see {@link HIP_LATERAL_INTERCEPT}. */
const HIP_LATERAL_SLOPE: number = 0.086;

/**
 * Height of the head joint below the vertex, as a fraction of head height. Grade: conventional placeholder.
 */
const HEAD_JOINT_DEPTH: number = 0.7;

/**
 * Distance of the clavicle's sternal end from the midline, as a fraction of biacromial breadth. Grade: conventional placeholder.
 */
const STERNOCLAVICULAR_OFFSET: number = 0.05;

/**
 * Generate the skeleton of one person from resolved measurements: a placeholder layout of the 20 torso, head and limb bones until the measured joint-centre formulas replace it.
 *
 * Measured where the identity measures it: hip, knee and ankle centres at the stacked leg lengths of each side, hip centres spread by Hara's regression, shoulder centres below the acromion by de Leva's offset and the biacromial half-breadth from the midline, elbow and wrist out along the T-pose arm by each side's segment lengths, the neck at cervicale height. Conventional where it does not: the spine bones divide the hip-to-cervicale span in quarters on a straight vertical line with no curvature, the head joint lies 0.7 head heights below the vertex, and the clavicles start just beside the midline at shoulder height. Fingers, toes, eyes and jaw are absent, and every joint keeps the engine's default axes and range of motion.
 *
 * @param measurements Resolved measurements of an admitted identity
 * @returns Skeleton with parents before children
 */
export function generateAutoMovieHumanSkeleton(
  measurements: IAutoMovieHumanMeasurements,
): IAutoMovieHumanSkeleton {
  const { body, head }: IAutoMovieHumanIdentity = measurements.identity;
  const joints: IAutoMovieHumanSkeleton.IJoint[] = [];
  const add: (
    bone: AutoMovieHumanoidBone,
    parent: AutoMovieHumanoidBone | null,
    position: IAutoMovieVector3,
  ) => void = (
    bone: AutoMovieHumanoidBone,
    parent: AutoMovieHumanoidBone | null,
    position: IAutoMovieVector3,
  ): void => {
    joints.push({ bone, parent, position, axes: null, constraint: null });
  };

  const hipHeight: number =
    (measurements.leftTrochanterionHeight +
      measurements.rightTrochanterionHeight) /
    2;
  const span: number = body.cervicaleHeight - hipHeight;
  const shoulderHeight: number = body.acromialHeight - ACROMION_TO_SHOULDER_CENTRE;

  add("hips", null, { x: 0, y: hipHeight, z: 0 });
  add("spine", "hips", { x: 0, y: hipHeight + span / 4, z: 0 });
  add("chest", "spine", { x: 0, y: hipHeight + span / 2, z: 0 });
  add("upperChest", "chest", { x: 0, y: hipHeight + (3 * span) / 4, z: 0 });
  add("neck", "upperChest", { x: 0, y: body.cervicaleHeight, z: 0 });
  add("head", "neck", {
    x: 0,
    y: body.stature - HEAD_JOINT_DEPTH * head.headHeight,
    z: 0,
  });

  for (const side of ["left", "right"] as const) {
    // +X is the person's left
    const sign: number = side === "left" ? 1 : -1;
    const arm: IAutoMovieHumanIdentity.IArm =
      side === "left" ? body.leftArm : body.rightArm;
    const leg: IAutoMovieHumanIdentity.ILeg =
      side === "left" ? body.leftLeg : body.rightLeg;
    const trochanterion: number =
      side === "left"
        ? measurements.leftTrochanterionHeight
        : measurements.rightTrochanterionHeight;

    const shoulderX: number = body.biacromialBreadth / 2;
    const elbowX: number = shoulderX + arm.upperArmLength;
    const wristX: number = elbowX + arm.forearmLength;
    add(`${side}Shoulder`, "upperChest", {
      x: sign * STERNOCLAVICULAR_OFFSET * body.biacromialBreadth,
      y: shoulderHeight,
      z: 0,
    });
    add(`${side}UpperArm`, `${side}Shoulder`, {
      x: sign * shoulderX,
      y: shoulderHeight,
      z: 0,
    });
    add(`${side}LowerArm`, `${side}UpperArm`, {
      x: sign * elbowX,
      y: shoulderHeight,
      z: 0,
    });
    add(`${side}Hand`, `${side}LowerArm`, {
      x: sign * wristX,
      y: shoulderHeight,
      z: 0,
    });

    const hipX: number =
      HIP_LATERAL_INTERCEPT + HIP_LATERAL_SLOPE * trochanterion;
    add(`${side}UpperLeg`, "hips", { x: sign * hipX, y: trochanterion, z: 0 });
    add(`${side}LowerLeg`, `${side}UpperLeg`, {
      x: sign * hipX,
      y: leg.ankleHeight + leg.shankLength,
      z: 0,
    });
    add(`${side}Foot`, `${side}LowerLeg`, {
      x: sign * hipX,
      y: leg.ankleHeight,
      z: 0,
    });
  }
  return { joints };
}
