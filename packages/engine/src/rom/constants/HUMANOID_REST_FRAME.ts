import { AutoMovieHumanoidBone } from "@automovie/interface";

import { IAutoMovieAxisFrame } from "../IAutoMovieAxisFrame";
import { IAutoMovieRestFrame } from "../IAutoMovieRestFrame";

/** Bones of each arm from the clavicle to the fingertips, without the side prefix. */
const ARM: readonly string[] = [
  "Shoulder",
  "UpperArm",
  "LowerArm",
  "Hand",
  "ThumbMetacarpal",
  "ThumbProximal",
  "ThumbDistal",
  "IndexProximal",
  "IndexIntermediate",
  "IndexDistal",
  "MiddleProximal",
  "MiddleIntermediate",
  "MiddleDistal",
  "RingProximal",
  "RingIntermediate",
  "RingDistal",
  "LittleProximal",
  "LittleIntermediate",
  "LittleDistal",
];

/** Bones of each leg from the hip to the toes, without the side prefix. */
const LEG: readonly string[] = ["UpperLeg", "LowerLeg", "Foot", "Toes"];

/** Bones whose fingertip-ward motions read on the hand's basis, without the side prefix. */
const HAND: readonly string[] = ARM.slice(3);

/** A reversed axis at the rig's own rest. */
const REVERSED: IAutoMovieAxisFrame = { sign: -1, neutral: 0 };

/**
 * Rest frames for the **canonical T-pose humanoid**: one clinical convention on both sides, so each clinical value means the same anatomical motion on the left and the right.
 *
 * The canonical rest pose is the VRM 1.0 T-pose, in a right-handed, Y-up frame: the figure faces +Z, so its left is +X; the arms extend along ±X, parallel to the ground, the left arm along +X; the palms face −Y; the four fingers of each hand extend along ±X with their nails toward +Y; and each thumb points between its arm's ±X and +Z. This is a convention, not a measurement, and retargeting between two humanoids holds only when both rest in it or declare where they differ, through these frames or their bones' own axes.
 *
 * Both sides share the axes of `HUMANOID_JOINT_AXES`. The body is mirror-symmetric about its sagittal (YZ) plane, and a turn about an axis lying in that plane, Y or Z, is mirrored into the opposite turn, while a turn about X is mirrored into itself. So every axis along Y or Z reverses on one side, which side being the one where a positive angle would otherwise not be the clinical motion below; axes along X need no frame. With `HUMANOID_JOINT_AXES`, a positive angle is:
 *
 * - Shoulder girdle: flexion protracts (the clavicle's tip moves forward), abduction elevates.
 * - Upper arm: flexion raises the arm forward, abduction raises it sideways (0 down, 90 horizontal, 180 overhead: the T-pose rests at 90), twist is external rotation, which turns the front of the arm upward in the T-pose.
 * - Forearm: flexion folds the forearm forward, toward the front of the upper arm; twist is pronation, which turns the T-pose's downward palm backward.
 * - Hand and every finger and thumb segment: flexion carries the fingertips toward the palm; abduction is radial deviation at the wrist and spreads a finger away from the middle finger (the middle finger and the thumb toward the thumb's side).
 * - Leg, knee, foot and toes: flexion swings the thigh forward and lifts the foot and toes (dorsiflexion), abduction carries the limb, or the sole, outward (eversion at the foot), twist turns the knee and toes outward (external rotation).
 *
 * The arm abduction frames were calibrated on the stickman (left sign +1, right −1, neutral 90) and are kept as they were. The spine, neck, head and jaw are single bones on the midline and keep the default reading: flexion bends forward, abduction bends toward the figure's right and twist turns its face toward its left. The eyes are left out on purpose: they turn together, a gaze to one side turning both eyes the same way, so they share one reading rather than a mirrored one.
 *
 * Reference: VRM 1.0 T-pose (https://github.com/vrm-c/vrm-specification/blob/master/specification/VRMC_vrm-1.0/tpose.md).
 *
 * @author Samchon
 */
export const HUMANOID_REST_FRAME: Partial<
  Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>
> = ((): Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>> => {
  const table: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>> = {};
  const set = (
    bone: string,
    axis: keyof IAutoMovieRestFrame,
    frame: IAutoMovieAxisFrame,
  ): void => {
    const key: AutoMovieHumanoidBone = bone as AutoMovieHumanoidBone;
    table[key] = { ...table[key], [axis]: frame };
  };
  // arms: flexion about Y and abduction about Z, except on the hand's basis
  for (const bone of ["Shoulder", "UpperArm", "LowerArm"]) {
    set(`left${bone}`, "flexion", REVERSED);
    set(`right${bone}`, "abduction", REVERSED);
  }
  // upper arm twist about X turns the front of either arm downward: internal
  set("leftUpperArm", "twist", REVERSED);
  set("rightUpperArm", "twist", REVERSED);
  // hand and fingers: flexion about Z, abduction about Y
  for (const bone of HAND) {
    set(`left${bone}`, "flexion", REVERSED);
    set(`left${bone}`, "abduction", REVERSED);
  }
  // legs: abduction about Z and twist about Y
  for (const bone of LEG) {
    set(`right${bone}`, "abduction", REVERSED);
    set(`right${bone}`, "twist", REVERSED);
  }
  set("leftUpperArm", "abduction", { sign: 1, neutral: 90 });
  set("rightUpperArm", "abduction", { sign: -1, neutral: 90 });
  return table;
})();
