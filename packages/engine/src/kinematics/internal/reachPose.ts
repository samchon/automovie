import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieHingedArticulation,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieJointRotationDomain,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieResolvedJointAngles,
  IAutoMovieRestFrame,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HUMANOID_REST_FRAME } from "../../rom/constants/HUMANOID_REST_FRAME";
import { getConstraint } from "../../rom/getConstraint";
import { armChainFault } from "./armChainFault";
import { clinicalDeviation } from "./clinicalDeviation";
import { HUMANOID_JOINT_AXES } from "../constants/HUMANOID_JOINT_AXES";
import { decomposeJointRotation } from "./decomposeJointRotation";
import { hingedArmArticulation } from "./hingedArmArticulation";
import { jointRomOvershoot } from "../jointRomOvershoot";
import { resolvePose } from "../resolvePose";
import { skeletonJointAxes } from "./skeletonJointAxes";

/**
 * The arm pose, upper arm and forearm articulation, that brings the `side` hand
 * onto `target` in the skeleton's model space: the harness `reach` verb made
 * concrete with analytic hinge geometry and the original bounded swivel search
 * for its clinical range of motion.
 *
 * Segment offsets and the shoulder's rest frame come from the skeleton's rest
 * pose, and {@link hingedArmArticulation} solves the chain: the elbow turns only
 * about its own flexion axis, so its abduction and twist are zero as an elbow's
 * immobile axes require, and the shoulder spends the chain's exact swivel
 * freedom on staying inside the rig's declared range of motion. An unreachable
 * target extends the arm fully toward it, so the hand stops on the reachable
 * shell instead of failing. A target no legal pose reaches still returns the
 * least-overshoot pose, which the shot's ROM gate then reports.
 *
 * The angles are clinical, so `validatePose` can compare them with the ROM
 * table directly. The clinical axes and the rest frame are two halves of one
 * convention: this function applies {@link HUMANOID_JOINT_AXES} under any axes
 * the arm bones declare ({@link skeletonJointAxes}) and so defaults `restFrames`
 * to the matching {@link HUMANOID_REST_FRAME}. Pass a table for a rig with its
 * own rest convention, or `{}` for raw rest-relative angles.
 *
 * Returns `null` when `side` is not `"left"` or `"right"` (the value arrives
 * from runtime calls), when the upper arm, lower arm or hand is missing, when
 * they are not one parent chain (lower arm under upper arm, hand under lower
 * arm), when the chain is not reachable from a root, when the chain is
 * geometrically degenerate, or when {@link armChainFault} finds an elbow that
 * cannot bend the arm.
 *
 * @param skeleton Rig whose arm is solved; read, never modified.
 * @param side Which arm reaches.
 * @param target Point the hand lands on, in the skeleton's model space.
 * @param restFrames Per-bone rest frames for the clinical lift; defaults to
 *   `HUMANOID_REST_FRAME`.
 */
export function reachPose(
  skeleton: IAutoMovieSkeleton,
  side: "left" | "right",
  target: IAutoMovieVector3,
  restFrames: Partial<
    Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>
  > = HUMANOID_REST_FRAME,
): IAutoMoviePose | null {
  if (side !== "left" && side !== "right") return null;

  const upperName: AutoMovieHumanoidBone =
    side === "left" ? "leftUpperArm" : "rightUpperArm";
  const lowerName: AutoMovieHumanoidBone =
    side === "left" ? "leftLowerArm" : "rightLowerArm";
  const handName: AutoMovieHumanoidBone =
    side === "left" ? "leftHand" : "rightHand";
  const declared: (
    name: AutoMovieHumanoidBone,
  ) => IAutoMovieBone | undefined = (
    name: AutoMovieHumanoidBone,
  ): IAutoMovieBone | undefined =>
    skeleton.bones.find((bone: IAutoMovieBone): boolean => bone.bone === name);
  const upperBone: IAutoMovieBone | undefined = declared(upperName);
  const lowerBone: IAutoMovieBone | undefined = declared(lowerName);
  const handBone: IAutoMovieBone | undefined = declared(handName);

  // The solve rotates the hand's rest offset in the lower arm's frame and the
  // lower arm's offset in the upper arm's frame, so they must be one chain.
  if (
    upperBone === undefined ||
    lowerBone === undefined ||
    handBone === undefined ||
    lowerBone.parent !== upperName ||
    handBone.parent !== lowerName
  )
    return null;

  // A rig whose elbow flexion is a roll has no reach shell to solve against.
  // Refused HERE, at the point of use, never at authoring time: the humanoid
  // bone enum is the only vocabulary the surface has, so a retargeted
  // quadruped's front legs legitimately ride the arm chains.
  if (armChainFault(skeleton, side) !== null) return null;

  const axes: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> =
    skeletonJointAxes(skeleton, HUMANOID_JOINT_AXES);
  const upper: IAutoMovieResolvedBone | undefined = resolvePose(
    { skeleton: skeleton.id, root: null, joints: [] },
    skeleton,
    axes,
  ).find((bone: IAutoMovieResolvedBone): boolean => bone.bone === upperName);
  if (upper === undefined) return null;

  // Every arm bone is present in the humanoid axis table by construction, and
  // a declaration only replaces an entry.
  const upperAxes: IAutoMovieJointAxes = axes[upperName]!;
  const lowerAxes: IAutoMovieJointAxes = axes[lowerName]!;
  const upperConstraint: IAutoMovieJointConstraint | null = getConstraint(
    upperName,
    upperBone.constraint,
  );
  const lowerConstraint: IAutoMovieJointConstraint | null = getConstraint(
    lowerName,
    lowerBone.constraint,
  );
  const upperDomain: IAutoMovieJointRotationDomain = {
    bone: upperName,
    constraint: upperConstraint,
  };
  const lowerDomain: IAutoMovieJointRotationDomain = {
    bone: lowerName,
    constraint: lowerConstraint,
  };

  const jointsOf: (
    upperDelta: IAutoMovieQuaternion,
    lowerDelta: IAutoMovieQuaternion,
  ) => [IAutoMovieClinicalJoint, IAutoMovieClinicalJoint] = (
    upperDelta: IAutoMovieQuaternion,
    lowerDelta: IAutoMovieQuaternion,
  ): [IAutoMovieClinicalJoint, IAutoMovieClinicalJoint] => [
    {
      bone: upperName,
      ...decomposeJointRotation(
        upperDelta,
        upperAxes,
        restFrames[upperName],
        upperDomain,
      ),
    },
    {
      bone: lowerName,
      ...decomposeJointRotation(
        lowerDelta,
        lowerAxes,
        restFrames[lowerName],
        lowerDomain,
      ),
    },
  ];

  const articulation: IAutoMovieHingedArticulation | null =
    hingedArmArticulation({
      upper,
      midOffset: lowerBone.rest.translation,
      midRest: lowerBone.rest.rotation,
      endOffset: handBone.rest.translation,
      hinge: lowerAxes.flexion,
      target,

      // Scored through the same clinical decomposition the result is reported
      // in, so the candidate the solver picks is the candidate `validatePose`
      // will grade.
      score: (
        upperDelta: IAutoMovieQuaternion,
        lowerDelta: IAutoMovieQuaternion,
      ): { overshoot: number; deviation: number } => {
        const [upperJoint, lowerJoint]: [
          IAutoMovieClinicalJoint,
          IAutoMovieClinicalJoint,
        ] = jointsOf(upperDelta, lowerDelta);
        return {
          overshoot:
            jointRomOvershoot(upperJoint, upperConstraint) +
            jointRomOvershoot(lowerJoint, lowerConstraint),
          deviation:
            clinicalDeviation(upperJoint) + clinicalDeviation(lowerJoint),
        };
      },
    });
  if (articulation === null) return null;

  return {
    skeleton: skeleton.id,
    root: null,
    joints: jointsOf(articulation.upper, articulation.lower),
  };
}

/** A joint whose three clinical angles are all known numbers. */
interface IAutoMovieClinicalJoint extends IAutoMovieResolvedJointAngles {
  bone: AutoMovieHumanoidBone;
}
