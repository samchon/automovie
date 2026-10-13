import { AutoMovieHumanoidBone, IAutoMovieBone, IAutoMovieJointConstraint, IAutoMoviePose, IAutoMovieQuaternion, IAutoMovieSkeleton, IAutoMovieVector3 } from "@automovie/interface";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { HUMANOID_REST_FRAME } from "../rom/constants/HUMANOID_REST_FRAME";
import { getConstraint } from "../rom/getConstraint";
import { IAutoMovieHingedArticulation } from "./IAutoMovieHingedArticulation";
import { IAutoMovieJointAxes } from "./IAutoMovieJointAxes";
import { IAutoMovieResolvedBone } from "./IAutoMovieResolvedBone";
import { IAutoMovieResolvedJointAngles } from "./IAutoMovieResolvedJointAngles";
import { armChainFault } from "./armChainFault";
import { clinicalDeviation } from "./clinicalDeviation";
import { HUMANOID_JOINT_AXES } from "./constants/HUMANOID_JOINT_AXES";
import { decomposeJointRotation } from "./decomposeJointRotation";
import { hingedArmArticulation } from "./hingedArmArticulation";
import { jointRomOvershoot } from "./jointRomOvershoot";
import { resolvePose } from "./resolvePose";
/** A joint whose three clinical angles are all known numbers. */
interface IAutoMovieClinicalJoint extends IAutoMovieResolvedJointAngles {
  bone: AutoMovieHumanoidBone;
}

/**
 * The arm pose, upper arm and forearm articulation, that brings the `side`
 * hand onto `target` in the skeleton's model space: the harness `reach` verb
 * made concrete, solved in closed form with no iteration.
 *
 * Segment offsets and the shoulder's rest frame come from the skeleton's rest
 * pose, and {@link hingedArmArticulation} solves the chain: the elbow turns
 * only about its own flexion axis, so its abduction and twist are zero as an
 * elbow's immobile axes require, and the shoulder spends the chain's exact
 * swivel freedom on staying inside the rig's declared range of motion. An
 * unreachable target extends the arm fully toward it, so the hand stops on the
 * reachable shell instead of failing. A target no legal pose reaches still
 * returns the least-overshoot pose, which the shot's ROM gate then reports.
 *
 * The angles are clinical, so `validatePose` can compare them with the ROM
 * table directly. The clinical axes and the rest frame are two halves of one
 * convention: this function always applies {@link HUMANOID_JOINT_AXES} and so
 * defaults `restFrames` to the matching {@link HUMANOID_REST_FRAME}. Pass a
 * table for a rig with its own rest convention, or `{}` for raw rest-relative
 * angles.
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
 *
 * @evidence contracts/common.md#principled-implementation Reads the arm's rest offsets under the premise that the three bones form one parent chain, which it checks before solving, so each offset is in its parent's frame as the hinge solve requires; candidates are scored through the same clinical decomposition and `jointRomOvershoot` the result is reported and gated with, so the solver cannot pick a pose by a kinder rule than `validatePose` applies.
 * @evidence contracts/common.md#clear-and-simple-design Owns the humanoid arm convention, bone names, axes, rest frames and ROM lookup, while `hingedArmArticulation` owns the geometry and `armChainFault` the rig diagnosis shared with the perform-shot gate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No rig, side or target is special-cased; an impossible reach returns its least-overshoot pose for the gate to report rather than a clamped one, and every refusal is a structural or geometric fact about the rig.
 * @evidence contracts/common.md#meaningful-documentation States the clinical output and why, the axis and rest-frame pairing with its default, the unreachable and illegal-target behavior, every `null` case including the parent-chain requirement, and each parameter's frame.
 * @evidence contracts/performance.md#efficient-algorithms Three linear bone lookups and one rest-pose forward-kinematics pass, linear in the bone count, then the hinge solve's at most 720 candidates, each two decompositions and two ROM scorings; the candidate sweep dominates and is constant per call.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of one rig, side and target; per-frame callers pass a different target each time, so no result is shared across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing after returning; the rest-pose bones and candidate scores are local to the call, and the caller owns the returned pose.
 * @author Samchon
 */
export const reachPose: (skeleton: IAutoMovieSkeleton, side: "left" | "right", target: IAutoMovieVector3, restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>) => IAutoMoviePose | null = (
  skeleton: IAutoMovieSkeleton,
  side: "left" | "right",
  target: IAutoMovieVector3,
  restFrames: Partial<
    Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>
  > = HUMANOID_REST_FRAME,
): IAutoMoviePose | null => {
  if (side !== "left" && side !== "right") return null;

  const upperName: AutoMovieHumanoidBone =
    side === "left" ? "leftUpperArm" : "rightUpperArm";
  const lowerName: AutoMovieHumanoidBone =
    side === "left" ? "leftLowerArm" : "rightLowerArm";
  const handName: AutoMovieHumanoidBone =
    side === "left" ? "leftHand" : "rightHand";
  const declared: (name: AutoMovieHumanoidBone) => IAutoMovieBone | undefined = (name: AutoMovieHumanoidBone): IAutoMovieBone | undefined =>
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

  const upper: IAutoMovieResolvedBone | undefined = resolvePose(
    { skeleton: skeleton.id, root: null, joints: [] },
    skeleton,
    HUMANOID_JOINT_AXES,
  ).find((bone: IAutoMovieResolvedBone): boolean => bone.bone === upperName);
  if (upper === undefined) return null;

  // Every arm bone is present in the humanoid axis table by construction.
  const upperAxes: IAutoMovieJointAxes = HUMANOID_JOINT_AXES[upperName]!;
  const lowerAxes: IAutoMovieJointAxes = HUMANOID_JOINT_AXES[lowerName]!;
  const upperConstraint: IAutoMovieJointConstraint | null = getConstraint(
    upperName,
    upperBone.constraint,
  );
  const lowerConstraint: IAutoMovieJointConstraint | null = getConstraint(
    lowerName,
    lowerBone.constraint,
  );

  const jointsOf: (upperDelta: IAutoMovieQuaternion, lowerDelta: IAutoMovieQuaternion) => [IAutoMovieClinicalJoint, IAutoMovieClinicalJoint] = (
    upperDelta: IAutoMovieQuaternion,
    lowerDelta: IAutoMovieQuaternion,
  ): [IAutoMovieClinicalJoint, IAutoMovieClinicalJoint] => [
    {
      bone: upperName,
      ...decomposeJointRotation(upperDelta, upperAxes, restFrames[upperName], {
        bone: upperName,
        constraint: upperConstraint,
      }),
    },
    {
      bone: lowerName,
      ...decomposeJointRotation(lowerDelta, lowerAxes, restFrames[lowerName], {
        bone: lowerName,
        constraint: lowerConstraint,
      }),
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
};
