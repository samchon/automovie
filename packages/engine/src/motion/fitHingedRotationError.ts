import type {
  AutoMovieHumanoidBone,
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
import type { IFitChainToTargetProps } from "./IFitChainToTargetProps";
import { basisOf } from "./basisOf";
import type { prepareChainPlant } from "./prepareChainPlant";
import { solveDistalTwist } from "./solveDistalTwist";

/**
 * How far, in degrees, the effector misses a requested rotation once a
 * hinged candidate's mid bone has taken its distal twist share and the
 * effector its swing, each clamped to the rig's range: the split that
 * `splitDistalTwist` and `orientChainEffector` later apply to the chosen
 * candidate, evaluated here for every candidate so the ranking sees the hand
 * the fit will actually show. A distally twisting mid bone's twist is the one
 * `solveDistalTwist` gives from the candidate's own and the effector the
 * pose holds; each joint is clamped through its clinical domain as the fit
 * clamps it. An effector its clamp leaves alone shows the request exactly, so
 * its error is zero, not rounding that would rank swivels and break the
 * mirror; any other error is the geodesic angle from `Quaternion.angle`.
 *
 * @param props The fit request.
 * @param prepared The chain's preparation.
 * @param axes The mid bone's axes.
 * @param rotation The requested effector rotation.
 * @returns The error of a candidate's bone-local root and mid rotations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read, which split it reads, when it is zero and the unit.
 * @evidence contracts/development/implementation.md#principled-implementation The candidate's twist is the one the fit will give (`solveDistalTwist`), so the ranking sees the shown hand.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One decomposition, one solve and one clamp per candidate.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only an effector its clamp leaves alone counts as reached.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per candidate, the mid joint's angles read once per mid rotation; read only for a comparison the ranking's bound cannot decide.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Bases are admitted once per fit by the caller.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function fitHingedRotationError(
  props: IFitChainToTargetProps,
  prepared: NonNullable<ReturnType<typeof prepareChainPlant>>,
  axes: IAutoMovieJointAxes,
  rotation: IAutoMovieQuaternion,
): (upper: IAutoMovieQuaternion, lower: IAutoMovieQuaternion) => number {
  const effector: AutoMovieHumanoidBone = props.chain.effector;
  const rest: IAutoMovieQuaternion =
    props.skeleton.bones.find((b): boolean => b.bone === effector)?.rest
      .rotation ?? Quaternion.identity();
  const effectorAxes: IAutoMovieJointAxes | undefined =
    props.jointAxes?.[effector];
  const lowerBasis: IAutoMovieJointAxes = basisOf(axes);
  const effectorBasis: IAutoMovieJointAxes = basisOf(effectorAxes);
  // Each joint's basis was admitted and normalized above, once for the whole
  // sweep, so the clamped angles are composed on it directly.
  const wanted: IAutoMovieQuaternion = Quaternion.normalize(rotation);
  const lowerFrame: IAutoMovieRestFrame | undefined =
    props.restFrames?.[props.chain.lower];
  const effectorFrame: IAutoMovieRestFrame | undefined =
    props.restFrames?.[effector];
  // The effector as the pose holds it, from which the mid twist is solved.
  const held: IAutoMovieJointPose = props.pose.joints.find(
    (j: IAutoMovieJointPose): boolean => j.bone === effector,
  ) ?? { bone: effector, flexion: null, abduction: null, twist: null };
  // A sweep's candidates on one bend branch share one mid rotation record,
  // so its angles are read once per record.
  let seen: IAutoMovieQuaternion | undefined;
  let angles: IAutoMovieResolvedJointAngles | undefined;
  return (upper: IAutoMovieQuaternion, lower: IAutoMovieQuaternion): number => {
    const above: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.multiply(prepared.upper.worldRotation, upper),
      prepared.lowerRotation,
    );
    // The mid bone's angles, its twist solved as splitDistalTwist solves it.
    if (seen !== lower || angles === undefined) {
      seen = lower;
      angles = decomposeJointRotationOnBasis(
        lower,
        lowerBasis,
        lowerFrame,
        prepared.lowerDomain,
      );
    }
    const read: IAutoMovieResolvedJointAngles = angles;
    const joint: IAutoMovieJointPose = { bone: props.chain.lower, ...read };
    const mid: IAutoMovieQuaternion = Quaternion.multiply(
      above,
      jointToQuaternionOnBasis(
        axes.twistPlacement === "distal"
          ? solveDistalTwist({
              joint,
              effector: held,
              above,
              lowerBasis,
              lowerFrame,
              effectorRest: rest,
              effectorBasis,
              effectorFrame,
              rotation,
              skeleton: props.skeleton,
            })
          : clampJointToSkeleton(joint, props.skeleton),
        lowerBasis,
        lowerFrame,
      ),
    );
    const local: IAutoMovieQuaternion = Quaternion.normalize(
      Quaternion.multiply(
        Quaternion.inverse(rest),
        Quaternion.multiply(Quaternion.inverse(mid), rotation),
      ),
    );
    const a: IAutoMovieResolvedJointAngles = decomposeJointRotationOnBasis(
      local,
      effectorBasis,
      effectorFrame,
    );
    const kept: IAutoMovieJointPose = clampJointToSkeleton(
      {
        bone: effector,
        flexion: a.flexion,
        abduction: a.abduction,
        twist: a.twist,
      },
      props.skeleton,
    );
    if (
      kept.flexion === a.flexion &&
      kept.abduction === a.abduction &&
      Math.abs((a.twist ?? 0) - (kept.twist ?? 0)) <= REACHED
    )
      return 0;
    const shown: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.multiply(mid, rest),
      jointToQuaternionOnBasis(kept, effectorBasis, effectorFrame),
    );
    return (
      (Quaternion.angle(Quaternion.normalize(shown), wanted) * 180) / Math.PI
    );
  };
}

/** The effector twist, degrees, a clamp may take off an effector still counted as reached: the rounding the closed-form twist solve leaves. */
const REACHED: number = 1e-9;
