import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedBone,
  Quaternion,
  resolvePose,
} from "@automovie/engine";
import {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { qclose } from "../internal/qclose";

/** A clinical axis of a joint. */
type Axis = "flexion" | "abduction" | "twist";

/**
 * One anatomical motion: a positive clinical angle on the left bone turns the left-side `probe` vector, given in the T-pose, toward `toward` (a world axis and its sign).
 */
interface ICase {
  bone: string;
  axis: Axis;
  probe: IAutoMovieVector3;
  toward: ["x" | "y" | "z", 1 | -1];
  motion: string;
}

const v = (x: number, y: number, z: number): IAutoMovieVector3 => ({ x, y, z });

/** The figure's left is +X and its front +Z; the palms face −Y and the fingers extend along ±X. */
const CASES: ICase[] = [
  { bone: "Shoulder", axis: "flexion", probe: v(1, 0, 0), toward: ["z", 1], motion: "protraction" },
  { bone: "Shoulder", axis: "abduction", probe: v(1, 0, 0), toward: ["y", 1], motion: "elevation" },
  { bone: "UpperArm", axis: "flexion", probe: v(1, 0, 0), toward: ["z", 1], motion: "forward raise" },
  { bone: "UpperArm", axis: "abduction", probe: v(1, 0, 0), toward: ["y", 1], motion: "side raise" },
  { bone: "UpperArm", axis: "twist", probe: v(0, 0, 1), toward: ["y", 1], motion: "external rotation" },
  { bone: "LowerArm", axis: "flexion", probe: v(1, 0, 0), toward: ["z", 1], motion: "elbow flexion" },
  { bone: "LowerArm", axis: "twist", probe: v(0, -1, 0), toward: ["z", -1], motion: "pronation" },
  { bone: "Hand", axis: "flexion", probe: v(1, 0, 0), toward: ["y", -1], motion: "palmar flexion" },
  { bone: "Hand", axis: "abduction", probe: v(1, 0, 0), toward: ["z", 1], motion: "radial deviation" },
  { bone: "IndexProximal", axis: "flexion", probe: v(1, 0, 0), toward: ["y", -1], motion: "finger flexion" },
  { bone: "IndexProximal", axis: "abduction", probe: v(1, 0, 0), toward: ["z", 1], motion: "toward the thumb" },
  { bone: "ThumbProximal", axis: "flexion", probe: v(1, 0, 0), toward: ["y", -1], motion: "thumb flexion" },
  { bone: "UpperLeg", axis: "flexion", probe: v(0, -1, 0), toward: ["z", 1], motion: "hip flexion" },
  { bone: "UpperLeg", axis: "abduction", probe: v(0, -1, 0), toward: ["x", 1], motion: "hip abduction" },
  { bone: "UpperLeg", axis: "twist", probe: v(0, 0, 1), toward: ["x", 1], motion: "hip external rotation" },
  { bone: "LowerLeg", axis: "flexion", probe: v(0, -1, 0), toward: ["z", -1], motion: "knee flexion" },
  { bone: "Foot", axis: "flexion", probe: v(0, 0, 1), toward: ["y", 1], motion: "dorsiflexion" },
  { bone: "Foot", axis: "abduction", probe: v(0, -1, 0), toward: ["x", 1], motion: "eversion" },
  { bone: "Foot", axis: "twist", probe: v(0, 0, 1), toward: ["x", 1], motion: "toe-out" },
  { bone: "Toes", axis: "flexion", probe: v(0, 0, 1), toward: ["y", 1], motion: "toe dorsiflexion" },
];

/** Clinical angle of the motion, degrees: 30 past each axis's neutral, the T-pose arm resting at abduction 90. */
const ANGLE = 30;

/**
 * Pins that every paired humanoid joint's clinical angle means the same anatomical motion on the left and the right, through `HUMANOID_JOINT_AXES` and `HUMANOID_REST_FRAME`.
 *
 * The rig is synthetic: every bone in the canonical T-pose with an identity rest rotation, so each bone's world rotation is its joint's articulation alone. The expected directions are anatomy read in that pose, not measurements.
 *
 * Scenarios:
 *
 * 1. For each joint and axis, a clinical value 30 past neutral on the left bone turns the left probe vector toward the anatomical direction of the named motion: forward for shoulder, elbow and hip flexion, up for arm raises and external rotation, toward the palm for wrist and finger flexion, outward for hip abduction, hip external rotation, eversion and toe-out.
 * 2. The same clinical value on the right bone gives the mirror image of the left rotation across the body's midplane, so the right probe turns the mirrored way and the motion is the same.
 *
 * @evidence contracts/testing.md#behavioral-verification Resolves a pose per joint, axis and side and compares the resolved world rotations; a joint whose sign differed between the sides fails the mirror check, and one whose positive angle was the opposite motion fails the direction check.
 * @evidence contracts/testing.md#independent-expectations The directions are anatomy of the VRM T-pose (front +Z, left +X, palms −Y), and the mirror of a rotation across the X = 0 plane is the quaternion with its Y and Z components negated; neither is computed by the product.
 * @evidence contracts/testing.md#distinguishing-cases Covers every axis of the shoulder, upper arm, forearm, hand, a finger, the thumb, hip, knee, foot and toes on both sides; the eyes, which turn together rather than mirrored, and the midline bones belong to other entries.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous kinematics entry that builds its own in-memory rig and calls engine source without a viewer or GPU.
 */
export function test_kinematics_humanoid_side_convention(): void {
  const skeleton: IAutoMovieSkeleton = rig();
  for (const c of CASES) {
    const left: IAutoMovieQuaternion = rotation(skeleton, `left${c.bone}`, c);
    const right: IAutoMovieQuaternion = rotation(skeleton, `right${c.bone}`, c);
    const moved: IAutoMovieVector3 = Quaternion.rotateVector(left, c.probe);
    const [axis, sign] = c.toward;
    TestValidator.predicate(
      `left ${c.bone} ${c.axis} is ${c.motion}`,
      sign * (moved[axis] - c.probe[axis]) > 0.1,
    );
    TestValidator.predicate(
      `right ${c.bone} ${c.axis} mirrors the left`,
      qclose(right, { w: left.w, x: left.x, y: -left.y, z: -left.z }, 1e-9),
    );
  }
}

/** World rotation of one bone after its clinical angle on one axis. */
function rotation(
  skeleton: IAutoMovieSkeleton,
  bone: string,
  c: ICase,
): IAutoMovieQuaternion {
  const neutral: number =
    HUMANOID_REST_FRAME[bone as AutoMovieHumanoidBone]?.[c.axis]?.neutral ??
    0;
  const joint: IAutoMovieJointPose = {
    bone: bone as AutoMovieHumanoidBone,
    flexion: null,
    abduction: null,
    twist: null,
    [c.axis]: neutral + ANGLE,
  };
  return resolvePose(
    { skeleton: skeleton.id, root: null, joints: [joint] },
    skeleton,
    HUMANOID_JOINT_AXES,
    HUMANOID_REST_FRAME,
  ).find((r: IAutoMovieResolvedBone): boolean => r.bone === bone)!
    .worldRotation;
}

/** A T-pose rig of both arms and legs with identity rest rotations. */
function rig(): IAutoMovieSkeleton {
  const bones: IAutoMovieBone[] = [make("hips", null, v(0, 1, 0))];
  for (const [side, s] of [
    ["left", 1],
    ["right", -1],
  ] as const) {
    const chain = (
      list: [string, string, IAutoMovieVector3][],
    ): void => {
      for (const [name, parent, t] of list)
        bones.push(make(`${side}${name}`, parent === "hips" ? "hips" : `${side}${parent}`, t));
    };
    chain([
      ["Shoulder", "hips", v(0.05 * s, 0.4, 0)],
      ["UpperArm", "Shoulder", v(0.12 * s, 0, 0)],
      ["LowerArm", "UpperArm", v(0.28 * s, 0, 0)],
      ["Hand", "LowerArm", v(0.25 * s, 0, 0)],
      ["IndexProximal", "Hand", v(0.09 * s, 0, 0.02)],
      ["ThumbProximal", "Hand", v(0.03 * s, 0, 0.04)],
      ["UpperLeg", "hips", v(0.09 * s, -0.05, 0)],
      ["LowerLeg", "UpperLeg", v(0, -0.42, 0)],
      ["Foot", "LowerLeg", v(0, -0.4, 0)],
      ["Toes", "Foot", v(0, -0.06, 0.13)],
    ]);
  }
  return { id: "side-convention", bones };
}

/** One bone with an identity rest rotation. */
function make(
  bone: string,
  parent: string | null,
  t: IAutoMovieVector3,
): IAutoMovieBone {
  return {
    bone: bone as AutoMovieHumanoidBone,
    parent: parent as AutoMovieHumanoidBone | null,
    rest: {
      translation: t,
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    constraint: null,
  };
}
