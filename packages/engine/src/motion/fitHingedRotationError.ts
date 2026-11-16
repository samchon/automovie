import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import type { IAutoMovieResolvedJointAngles } from "../kinematics/IAutoMovieResolvedJointAngles";
import { decomposeJointRotationOnBasis } from "../kinematics/decomposeJointRotationOnBasis";
import { jointToQuaternionOnBasis } from "../kinematics/jointToQuaternionOnBasis";
import { Quaternion } from "../math/Quaternion";
import type { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { clampJointToSkeleton } from "../rom/clampJointToSkeleton";
import { getConstraint } from "../rom/getConstraint";
import { toClinicalAngle } from "../rom/toClinicalAngle";
import type { IFitChainToTargetProps } from "./IFitChainToTargetProps";
import { basisOf } from "./basisOf";
import type { prepareChainFit } from "./prepareChainFit";
import type { prepareChainPlant } from "./prepareChainPlant";
import { prepareJointRotationProjection } from "./prepareJointRotationProjection";
import { solveDistalTwist } from "./solveDistalTwist";

/**
 * Prepare the actual displayed rotation error, degrees, of hinged candidates.
 * Each lower candidate takes the same bounded distal-twist choice as the final
 * fit; its effector then uses the same quaternion projection as orientation.
 * The world rotation is recomposed through the preparation's entire fixed
 * lower-to-effector frame, including intermediate bones, before its geodesic
 * error is read. No small miss or unchanged Euler clamp is replaced by zero.
 *
 * @param props The fit request under unchanged pose, rig and clinical mappings.
 * @param prepared The matching chain preparation.
 * @param axes The mid bone's axes, below any skeleton-declared override.
 * @param rotation Requested model-frame effector rotation.
 * @param rig Optional lazy workspace rig under the same source, prepared frames and clinical mappings; target results remain scorer-local.
 * @returns A per-fit scorer of bone-local upper/lower rotations. Its optional third input is the exact completed (prepared upper world * this upper) * fixed lower frame for the same candidate.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines degree-valued displayed error, fixed intermediate frame, shared final split/projection, immutable fit premises and actual residual reporting.
 * @evidence contracts/development/implementation.md#principled-implementation Prepared FK composes the candidate's exact completed prefix or recomputes it in the original grouping. solveDistalTwist and prepareJointRotationProjection are final display's same owners, and the selected raw effector composition is reused before the original world normalization and angle read.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Per-fit bases, clamps and projection precede one candidate closure. It reads lower angles once per shared quaternion record, applies the shared split and projection, and scores the shown world rotation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Skeleton axes/ROM and the last authored effector match full FK. No forced-zero residual or claim that the five distal candidates globally solve the combined joints replaces actual composition.
 * @evidence contracts/development/implementation.md#efficient-algorithms Standalone setup scans B bones and J authored joints, O(B+J) work; a supplied workspace rig shares those lookups, source held joint, admitted bases, clamps, projector and fixed-frame inverse across its target fits. A non-distal candidate queries it once; a distal candidate has at most five twist-score queries plus one final displayed query, at most six. Each eligible query recomposes the reference plus at most eighteen pairs, at most nineteen actual joint scores or 114 across six queries; unsupported queries retain the factory's four-sweep, forty-step-per-axis fallback, at most 528 recompositions per query. Chain FK and final world-error composition remain additional constant work; runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One unchanged workspace shares admitted bases, clamps, source-held rotation and its exact Quaternion.inverse, fixed inverse, fixed effector-axis/clinical-zero preparation and effector projector; standalone scoring prepares those lazy fixed readings once for this target instead. Every solve still reads the actual held raw rotation before borrowing its inverse at the original use site. This scorer owns one lower-factor/inner-product composer, borrowed by each distal solve and the following actual lower composition; every clinical/frame check and fresh outer product remains. Its current immutable lower quaternion shares one completed clinical joint record, exact raw/rig-zero-twist compositions and their reader closures, invalidated when that quaternion record changes. The proximal clamp still receives its own fresh copy. A supplied upper prefix belongs to this exact candidate. No lower/candidate/target answer crosses into another target scorer; changed rig/frame/source dependencies require new preparation.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The target fit releases its scorer, latest lower clinical joint/raw/untwisted readings and standalone held raw/inverse readings; each is constant-size. Shared source-held raw/inverse and projector remain owned by the caller's workspace. Same-query paired projection avoids another raw composition without retaining an answer across queries; no global handle or growing result cache exists.
 */
export function fitHingedRotationError(
  props: IFitChainToTargetProps,
  prepared: NonNullable<ReturnType<typeof prepareChainPlant>>,
  axes: IAutoMovieJointAxes,
  rotation: IAutoMovieQuaternion,
  rig?: prepareChainFit.IRig,
): (upper: IAutoMovieQuaternion, lower: IAutoMovieQuaternion, preparedAbove?: IAutoMovieQuaternion) => number {
  const effector: AutoMovieHumanoidBone = props.chain.effector;
  const effectorBone: IAutoMovieBone | undefined =
    rig === undefined
      ? props.skeleton.bones.find(
          (bone: IAutoMovieBone): boolean => bone.bone === effector,
        )
      : rig.bone(effector);
  const rest: IAutoMovieQuaternion = prepared.effectorBaseRotation;
  const lowerBasis: IAutoMovieJointAxes =
    rig?.basis(props.chain.lower, "decomposeJointRotation axes") ??
    basisOf(
      props.skeleton.bones.find(
        (bone: IAutoMovieBone): boolean => bone.bone === props.chain.lower,
      )?.axes ?? axes,
    );
  const effectorBasis: IAutoMovieJointAxes =
    rig?.basis(effector, "decomposeJointRotation axes") ??
    basisOf(effectorBone?.axes ?? props.jointAxes?.[effector]);
  const wanted: IAutoMovieQuaternion = Quaternion.normalize(rotation);
  const lowerFrame: IAutoMovieRestFrame | undefined =
    props.restFrames?.[props.chain.lower];
  const effectorFrame: IAutoMovieRestFrame | undefined =
    props.restFrames?.[effector];
  let held: IAutoMovieJointPose = rig?.held() ?? {
    bone: effector,
    flexion: null,
    abduction: null,
    twist: null,
  };
  if (rig === undefined)
    for (const joint of props.pose.joints)
      if (joint.bone === effector) held = joint;
  const clampLower: (joint: IAutoMovieJointPose) => IAutoMovieJointPose =
    rig?.clamp(props.chain.lower) ??
    clampJointToSkeleton.of(props.chain.lower, props.skeleton);
  const clampEffector: (joint: IAutoMovieJointPose) => IAutoMovieJointPose =
    rig?.clamp(effector) ?? clampJointToSkeleton.of(effector, props.skeleton);
  const project: prepareJointRotationProjection.IProjector =
    rig?.effectorProjection() ??
    prepareJointRotationProjection({
      domain: {
        bone: effector,
        constraint: getConstraint(effector, effectorBone?.constraint ?? null),
      },
      basis: effectorBasis,
      frame: effectorFrame,
      clamp: clampEffector,
    });
  const restInverse: IAutoMovieQuaternion =
    rig?.effectorRestInverse() ?? Quaternion.inverse(rest);
  const clamps: NonNullable<Parameters<typeof solveDistalTwist>[0]["clamps"]> = {
    lower: clampLower,
    effector: clampEffector,
  };

  // Bend candidates can share one immutable lower quaternion record.
  let seen: IAutoMovieQuaternion | undefined;
  let lowerJoint: IAutoMovieJointPose | undefined;
  let clamped: IAutoMovieQuaternion | undefined;
  let heldRotation: IAutoMovieQuaternion | undefined;
  let heldInverse: IAutoMovieQuaternion | undefined;
  let composeLower: ReturnType<typeof jointToQuaternionOnBasis.prepare> | undefined;
  let preparedEffector: solveDistalTwist.IPrepared | undefined;

  /** Share pure lower-axis factors only inside this target's scorer. */
  const lowerRotation: ReturnType<typeof jointToQuaternionOnBasis.prepare> = (
    joint: Parameters<ReturnType<typeof jointToQuaternionOnBasis.prepare>>[0],
  ): IAutoMovieQuaternion => {
    composeLower ??= jointToQuaternionOnBasis.prepare(lowerBasis, lowerFrame);
    return composeLower(joint);
  };

  /** Prepare lazy raw readers once for this immutable lower record. */
  const prepareLowerReadings: (
    joint: IAutoMovieJointPose,
  ) => Pick<Parameters<typeof solveDistalTwist>[0], "readArticulated" | "readUntwisted"> = (
    joint: IAutoMovieJointPose,
  ): Pick<Parameters<typeof solveDistalTwist>[0], "readArticulated" | "readUntwisted"> => {
    let articulated: IAutoMovieQuaternion | undefined;
    let untwisted: IAutoMovieQuaternion | undefined;
    return {
      readArticulated: (): IAutoMovieQuaternion => {
        if (articulated === undefined) articulated = lowerRotation(joint);
        return articulated;
      },
      readUntwisted: (): IAutoMovieQuaternion => {
        if (untwisted === undefined) untwisted = lowerRotation(
          { ...joint, twist: toClinicalAngle(0, lowerFrame?.twist) },
        );
        return untwisted;
      },
    };
  };
  let lowerReadings: ReturnType<typeof prepareLowerReadings> | undefined;

  /** Read source-only held rotation at the solver's original first-use site. */
  const readHeldRotation: () => IAutoMovieQuaternion = (): IAutoMovieQuaternion => {
    if (rig !== undefined) return rig.heldRotation();
    if (heldRotation === undefined) heldRotation = Quaternion.multiply(
      rest, jointToQuaternionOnBasis(held, effectorBasis, effectorFrame),
    );
    return heldRotation;
  };

  /** The actual held raw was read first; share only its unchanged inverse. */
  const readHeldInverse: (raw: IAutoMovieQuaternion) => IAutoMovieQuaternion = (
    raw: IAutoMovieQuaternion,
  ): IAutoMovieQuaternion => {
    if (rig !== undefined) return rig.heldRotationInverse();
    if (heldInverse === undefined) heldInverse = Quaternion.inverse(raw);
    return heldInverse;
  };
  return (upper: IAutoMovieQuaternion, lower: IAutoMovieQuaternion, preparedAbove?: IAutoMovieQuaternion): number => {
    const above: IAutoMovieQuaternion = preparedAbove ?? Quaternion.multiply(
      Quaternion.multiply(prepared.upper.worldRotation, upper),
      prepared.lowerRotation,
    );
    if (seen !== lower || lowerJoint === undefined) {
      seen = lower;
      const angles: IAutoMovieResolvedJointAngles = decomposeJointRotationOnBasis(
        lower,
        lowerBasis,
        lowerFrame,
        prepared.lowerDomain,
      );
      lowerJoint = { bone: props.chain.lower, ...angles };
      lowerReadings = undefined;
      clamped =
        lowerBasis.twistPlacement === "distal"
          ? undefined
          : lowerRotation(
              clampLower({ ...lowerJoint }),
            );
    }
    const joint: IAutoMovieJointPose = lowerJoint;
    const mid: IAutoMovieQuaternion = Quaternion.multiply(
      above,
      clamped ??
        lowerRotation(
          solveDistalTwist({
            joint,
            effector: held,
            above,
            lowerBasis,
            lowerFrame,
            effectorRest: rest,
            effectorRestInverse: restInverse,
            effectorBasis,
            effectorFrame,
            rotation,
            skeleton: props.skeleton,
            clamps,
            projectEffector: project,
            projectEffectorWithQuaternion: project.withQuaternion,
            composeLower: lowerRotation,
            preparedEffector: preparedEffector ??= rig?.distalTwist() ?? solveDistalTwist.prepare({
              effectorRest: rest,
              effectorBasis,
              effectorFrame,
            }),
            ...(lowerReadings ??= prepareLowerReadings(joint)),
            readHeldRotation,
            readHeldInverse,
          }),
        ),
    );
    const local: IAutoMovieQuaternion = Quaternion.normalize(
      Quaternion.multiply(
        restInverse,
        Quaternion.multiply(Quaternion.inverse(mid), rotation),
      ),
    );
    const shown: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.multiply(mid, rest),
      project.withQuaternion(local).quaternion,
    );
    return (
      (Quaternion.angle(Quaternion.normalize(shown), wanted) * 180) / Math.PI
    );
  };
}
