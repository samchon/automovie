import {
  AutoMovieHumanoidBone,
  type IAutoMovieArmChainFault,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { HUMANOID_JOINT_AXES } from "./constants/HUMANOID_JOINT_AXES";
import { skeletonJointAxes } from "./internal/skeletonJointAxes";

/**
 * Sine of the angle below which a hinge counts as parallel to the segment it
 * drives. It is the same `1e-6` the engine's other degeneracy guards use for a
 * length, asked of an angle. A hinge merely close to parallel still bends the
 * arm, weakly, so it is not refused.
 */
const PARALLEL_SINE: number = 1e-6;

/**
 * Why the analytic arm IK cannot articulate one arm chain of `skeleton`, or
 * `null` when it can.
 *
 * `HUMANOID_JOINT_AXES` puts the arm's flexion on local +Y because the
 * canonical humanoid rests in the VRM T-pose with its arms along local ±X. On a
 * rig whose forearm rests along that flexion axis, such as arms hanging along
 * −Y, elbow flexion only rolls the forearm about its own length: the hand never
 * moves, the chain has one reachable radius instead of a shell, and no reach
 * can be solved. This function reports that rig, naming the lower arm and both
 * directions in `reason`.
 *
 * The test reads the rig, not a pose name, because a retargeted quadruped's
 * front legs ride the arm chains and may legitimately rest along −Y. Callers
 * therefore ask it only where an arm verb is performed: the perform-shot gate
 * refuses the verb with this reason, and {@link reachPose} returns `null`.
 *
 * `null` also answers every case that is not this fault: a missing hand, a hand
 * not parented to the lower arm (its rest offset is then not in the elbow's
 * frame), a zero-length forearm, and an axis table with no or a zero-length
 * elbow flexion axis. {@link reachPose} reports the structural cases itself as a
 * chain it cannot measure.
 *
 * @param skeleton Rig whose arm chain is read; only rest offsets are used.
 * @param side Which arm to test.
 * @param jointAxes Per-bone clinical axes; defaults to `HUMANOID_JOINT_AXES`,
 *   the table every arm computation applies, under any axes the lower arm
 *   declares itself.
 */
export const armChainFault: (
  skeleton: IAutoMovieSkeleton,
  side: "left" | "right",
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>,
) => IAutoMovieArmChainFault | null = (
  skeleton: IAutoMovieSkeleton,
  side: "left" | "right",
  jointAxes: Partial<
    Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>
  > = HUMANOID_JOINT_AXES,
): IAutoMovieArmChainFault | null => {
  const lowerName: AutoMovieHumanoidBone =
    side === "left" ? "leftLowerArm" : "rightLowerArm";
  const handName: AutoMovieHumanoidBone =
    side === "left" ? "leftHand" : "rightHand";

  const hand: IAutoMovieBone | undefined = skeleton.bones.find(
    (bone: IAutoMovieBone): boolean => bone.bone === handName,
  );
  if (hand === undefined || hand.parent !== lowerName) return null;

  // The mid joint's articulation is applied INSIDE the bone's rest rotation
  // (`worldRot = parentWorld · rest · articulation`), so it rotates the hand's
  // rest offset directly: both vectors are read in that one bone-local frame.
  const fore: IAutoMovieVector3 = hand.rest.translation;
  const foreLength: number = Vector3.length(fore);
  if (foreLength < 1e-6) return null;

  const flexion: IAutoMovieVector3 | undefined = skeletonJointAxes(
    skeleton,
    jointAxes,
  )[lowerName]?.flexion;
  if (flexion === undefined) return null;
  const hingeLength: number = Vector3.length(flexion);
  if (hingeLength < 1e-6) return null;

  const sine: number = Vector3.length(
    Vector3.cross(Vector3.normalize(flexion), Vector3.normalize(fore)),
  );
  if (sine >= PARALLEL_SINE) return null;

  return {
    side,
    bone: lowerName,
    reason:
      `${lowerName} cannot bend this arm: its flexion axis (${axisText(flexion)}) is parallel to the ` +
      `forearm's own rest direction (${axisText(fore)}), so elbow flexion rolls the forearm along its ` +
      `length and never moves the hand. The humanoid arm axes place flexion off the bone's length for a ` +
      `rig resting in the canonical T-pose (arms along local ±X); an arm resting ALONG its flexion axis ` +
      `has no reach shell, only a fixed radius, so no arm IK pose can be solved for it.`,
  };
};

const axisText: (axis: IAutoMovieVector3) => string = (
  axis: IAutoMovieVector3,
): string => `${trim(axis.x)}, ${trim(axis.y)}, ${trim(axis.z)}`;

/** Six significant digits, trailing zeros dropped: a readable, stable number. */
const trim: (value: number) => string = (value: number): string =>
  String(Number(value.toPrecision(6)));
