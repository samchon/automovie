import { AutoMovieHumanoidBone } from "@automovie/interface";

import { IAutoMovieRestFrame } from "../IAutoMovieRestFrame";

/**
 * Rest frames for the **canonical T-pose humanoid**, where they differ from the
 * identity. The shoulders sit at ~90° clinical abduction at rest, and the two
 * sides mirror the abduction sign (a first pass: flexion/twist reconciliation
 * is future work). Bones omitted need no shift (legs/spine rest at clinical
 * neutral).
 *
 * The canonical rest pose is the VRM 1.0 T-pose, in a right-handed, Y-up
 * frame: the figure faces +Z, so its left is +X; the arms extend along ±X,
 * parallel to the ground, the left arm along +X; the palms face −Y; the four
 * fingers of each hand extend along ±X with their nails toward +Y; and each
 * thumb points between its arm's ±X and +Z. This is a convention, not a
 * measurement, and retargeting between two humanoids holds only when both rest
 * in it or declare where they differ, through these frames or their bones' own
 * axes. It fixes what wrist and finger flexion mean, a turn that carries the
 * fingertips toward the −Y palm; `HUMANOID_JOINT_AXES` gives the hand the arm
 * basis and the fingers the default one, neither of which turns that way, so a
 * rig that flexes them declares their axes on its bones.
 *
 * Reference: VRM 1.0 T-pose (https://github.com/vrm-c/vrm-specification/blob/master/specification/VRMC_vrm-1.0/tpose.md).
 *
 * @author Samchon
 */
export const HUMANOID_REST_FRAME: Partial<
  Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>
> = {
  leftUpperArm: { abduction: { sign: 1, neutral: 90 } },
  rightUpperArm: { abduction: { sign: -1, neutral: 90 } },
};
