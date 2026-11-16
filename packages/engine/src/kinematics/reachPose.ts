import {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { HUMANOID_REST_FRAME } from "../rom/constants/HUMANOID_REST_FRAME";
import { getConstraint } from "../rom/getConstraint";
import { IAutoMovieHingedArticulation } from "./IAutoMovieHingedArticulation";
import { IAutoMovieResolvedBone } from "./IAutoMovieResolvedBone";
import { IAutoMovieResolvedJointAngles } from "./IAutoMovieResolvedJointAngles";
import { armChainFault } from "./armChainFault";
import { clinicalDeviation } from "./clinicalDeviation";
import { HUMANOID_JOINT_AXES } from "./constants/HUMANOID_JOINT_AXES";
import { decomposeJointRotation } from "./decomposeJointRotation";
import { hingedArmArticulation } from "./hingedArmArticulation";
import { hingedArmSwivel } from "./hingedArmSwivel";
import { jointRomOvershoot } from "./jointRomOvershoot";
import { prepareReachJointResolution } from "./prepareReachJointResolution";
import { resolvePose } from "./resolvePose";
import { skeletonJointAxes } from "./skeletonJointAxes";

/** A joint whose three clinical angles are all known numbers. */
interface IAutoMovieClinicalJoint extends IAutoMovieResolvedJointAngles {
  bone: AutoMovieHumanoidBone;
}

/** Actual source admission and target-independent inputs of one unchanged arm. */
interface ISource {
  /** Fixed rig whose id labels every fresh returned pose. */
  skeleton: IAutoMovieSkeleton;

  /** Fresh complete-rest-FK shoulder frame, admitted before target solving. */
  upper: IAutoMovieResolvedBone;

  /** Actual fixed lower/hand records supplying their parent-frame rest geometry. */
  lowerBone: IAutoMovieBone;
  handBone: IAutoMovieBone;

  /** The lower bone's merged clinical axes and actual effective constraints. */
  lowerAxes: IAutoMovieJointAxes;
  upperConstraint: IAutoMovieJointConstraint | null;
  lowerConstraint: IAutoMovieJointConstraint | null;

  /** Original clinical lift, shared by every candidate and final output. */
  jointsOf: (
    upper: IAutoMovieQuaternion,
    lower: IAutoMovieQuaternion,
  ) => [IAutoMovieClinicalJoint, IAutoMovieClinicalJoint];

  /** Genuine fixed-clinical source factory; every solve receives independent inverse readers. */
  jointsFactory?: ReturnType<typeof prepareReachJointResolution>;

  /** Actual fixed chain data and its genuine lazy geometric preparation, only for explicit prepare. */
  hingeSource?: {
    chain: Omit<hingedArmSwivel.IChain, "target" | "range">;
    prepared: hingedArmSwivel.IPrepared;
  };
}

/**
 * The arm pose, upper arm and forearm articulation, that brings the `side`
 * hand onto `target` in the skeleton's model space: the harness `reach` verb
 * made concrete with analytic hinge geometry and the original bounded swivel
 * search for its clinical range of motion.
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
 * convention: this function applies {@link HUMANOID_JOINT_AXES} under any
 * axes the arm bones declare ({@link skeletonJointAxes}) and so defaults
 * `restFrames` to the matching {@link HUMANOID_REST_FRAME}. Pass a
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
 * @evidence contracts/development/implementation.md#principled-implementation Reads the arm's rest offsets under the premise that the three bones form one parent chain, which it checks before solving, so each offset is in its parent's frame as the hinge solve requires; candidates are scored through the same clinical decomposition and `jointRomOvershoot` the result is reported and gated with, so the solver cannot pick a pose by a kinder rule than `validatePose` applies.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure sourceOf owns original source admission/full rest FK/clinical lift; solve owns every target's unchanged hinge call/ranking. Raw calls rebuild source data. prepare binds one actual fixed source and delegates its constant geometric preparation to hingedArmSwivel, retaining all target policy in existing owners.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No rig, side or target is special-cased; an impossible reach returns its least-overshoot pose for the gate to report rather than a clamped one, and every refusal is a structural or geometric fact about the rig.
 * @evidence contracts/development/common.md#meaningful-documentation States clinical output, axis/frame defaults, every null/refusal case and model-metre target units. prepare below defines actual first-source admission, unchanged rig/mapping lifetime, failure retry, complete original candidate search and fresh results.
 * @evidence contracts/development/implementation.md#efficient-algorithms Raw calls retain three bone searches, diagnosis, merged axes and full B-bone rest FK before at most 720 coarse candidates plus the original bounded refinements, each with two clinical decompositions/scorings. prepare shares actual source setup and lazy span/inverse arithmetic once; each target still creates independent geometric readers and all original candidates. Runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Explicit prepare owns actual shoulder FK, fixed source records/constraints and genuine hingedArmSwivel preparation. Its clinical source factory admits each basis at first actual candidate and shares only fixed affine metadata, creating independent inverse readers per target. Each target also creates matching geometric readers; no score or pose crosses solves. Structural null is source diagnosis and failed source production installs no reading.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Raw source/candidates end with the call. A prepared closure borrows fixed rig/frame inputs and owns one actual source result until its synchronous bake ends; it retains no target/history or previous output pose. Every result owns fresh joints, and the native baker returns only numeric keyframes without the preparation.
 */
export function reachPose(
  skeleton: IAutoMovieSkeleton,
  side: "left" | "right",
  target: IAutoMovieVector3,
  restFrames: Partial<
    Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>
  > = HUMANOID_REST_FRAME,
): IAutoMoviePose | null {
  const source: ISource | null = sourceOf(skeleton, side, restFrames);
  return source === null ? null : solve(source, target);
}

/**
 * Lazy actual source preparation for synchronous native arm bakes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines a fixed rig/side/clinical-frame lifetime and distinguishes source metadata from every changing target/solution.
 * @evidence contracts/development/design.md#principled-representation The producer retains only actual target-independent source admission, full rest FK and the original clinical lift. Targets remain model-metre values read separately on every solve, and types certify no source validity before the first actual call.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The single prepare companion serves moving point, strike and reach native bakes; standalone reachPose keeps its existing call shape and complete live admission.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No ready flag, target/pose cache, special rig, candidate reduction or alternative ROM rule is represented. A prepared scope requires unchanged rig/frames and is recreated for a different source.
 */
export namespace reachPose {
  /**
   * Bind one unchanged rig, arm and clinical rest-frame table. Construction
   * reads no source geometry. The first actual target performs the original
   * source admission/full rest FK and genuine lazy source geometry, retaining
   * only that actual metadata or fixed structural null. A thrown source error
   * is never installed as a reading.
   * Every target then runs the original hinge sweep, clinical lifting, ROM
   * ranking and final joint creation; no target answer or miss is reused.
   * Keep all borrowed source values unchanged or construct another reader.
   * Source work is linear once, each original bounded solve remains, and the
   * caller releases source metadata with its synchronous bake. No output pose,
   * time, callback result, task or handle enters this closure.
   */
  export function prepare(
    skeleton: IAutoMovieSkeleton,
    side: "left" | "right",
    restFrames: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>> = HUMANOID_REST_FRAME,
  ): (target: IAutoMovieVector3) => IAutoMoviePose | null {
    let source: ISource | null | undefined;
    return (target: IAutoMovieVector3): IAutoMoviePose | null => {
      if (source === undefined) {
        const reading: ISource | null = sourceOf(skeleton, side, restFrames, prepareReachJointResolution);

        if (reading !== null) {
          const chain: Omit<hingedArmSwivel.IChain, "target" | "range"> = {
            upper: reading.upper,
            midOffset: reading.lowerBone.rest.translation,
            midRest: reading.lowerBone.rest.rotation,
            endOffset: reading.handBone.rest.translation,
            hinge: reading.lowerAxes.flexion,
          };
          reading.hingeSource = { chain, prepared: hingedArmSwivel.prepare(chain) };
        }
        source = reading;
      }
      return source === null ? null : solve(source, target);
    };
  }
}

/** Preserve the original ordered source diagnosis and full-rest-FK admission. */
function sourceOf(
  skeleton: IAutoMovieSkeleton,
  side: "left" | "right",
  restFrames: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>,
  prepareJoints?: typeof prepareReachJointResolution,
): ISource | null {
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

  const jointsOf: (
    upperDelta: IAutoMovieQuaternion,
    lowerDelta: IAutoMovieQuaternion,
  ) => [IAutoMovieClinicalJoint, IAutoMovieClinicalJoint] = (
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

  return { skeleton, upper, lowerBone, handBone, lowerAxes,
    upperConstraint, lowerConstraint, jointsOf,
    ...(prepareJoints === undefined ? {} : { jointsFactory: prepareJoints({
      upper: { bone: upperName, axes: upperAxes, constraint: upperConstraint },
      lower: { bone: lowerName, axes: lowerAxes, constraint: lowerConstraint },
      frames: restFrames,
    }) }),
  };
}

/** Run every original target/candidate decision on the actual fixed source data. */
function solve(source: ISource, target: IAutoMovieVector3): IAutoMoviePose | null {
  const { skeleton, upper, lowerBone, handBone, lowerAxes,
    upperConstraint, lowerConstraint }: ISource = source;
  const jointsOf: ISource["jointsOf"] = source.jointsFactory?.() ?? source.jointsOf;

  const chain: Omit<hingedArmSwivel.IChain, "target" | "range"> = source.hingeSource?.chain ?? {
    upper,
    midOffset: lowerBone.rest.translation,
    midRest: lowerBone.rest.rotation,
    endOffset: handBone.rest.translation,
    hinge: lowerAxes.flexion,
  };

  const articulation: IAutoMovieHingedArticulation | null =
    hingedArmArticulation({
      ...chain,
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
      ...(source.hingeSource === undefined ? {} : { prepared: source.hingeSource.prepared.target(target) }),
    });
  if (articulation === null) return null;

  return {
    skeleton: skeleton.id,
    root: null,
    joints: jointsOf(articulation.upper, articulation.lower),
  };
}
