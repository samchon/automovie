import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { clinicalDeviation } from "../kinematics/clinicalDeviation";
import { decomposeJointRotation } from "../kinematics/decomposeJointRotation";
import { hingedArmArticulation } from "../kinematics/hingedArmArticulation";
import { jointRomOvershoot } from "../kinematics/jointRomOvershoot";
import { jointToQuaternion } from "../kinematics/jointToQuaternion";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { clampJointToSkeleton } from "../rom/clampJointToSkeleton";
import type { IAutoMovieSolvedChainPlant } from "./IAutoMovieSolvedChainPlant";
import type { IFitChainToTargetProps } from "./IFitChainToTargetProps";
import type { prepareChainPlant } from "./prepareChainPlant";

/**
 * The hinged chain's candidate: `hingedArmArticulation`'s swivel sweep with
 * each candidate decomposed through the prepared clinical domains, scored
 * first by the rig's ROM overshoot and then by how far the mid joint swings
 * from the bend hint's side of the root-to-target axis (world-down when no
 * hint is given, the analytic default), with the clinical effort as a
 * vanishing tie-break.
 *
 * @param props The fit request, with merged axes.
 * @param prepared The chain's preparation.
 * @param axes The mid bone's axes; its flexion is the hinge.
 * @param rotation A requested effector rotation, ranked before the hint's side when given.
 * @returns The candidate, or null for a degenerate chain.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the sweep, the three-level ranking and the frames of every input.
 * @evidence contracts/development/implementation.md#principled-implementation The swivel parameterisation of Tolani, Goswami and Badler 2000 through the engine's hingedArmArticulation, scored through the same clinical decomposition and ROM overshoot the fit reports.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One scoring closure over hingedArmArticulation's sweep; the effector error is a separate member.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Overshoot ranks first, so no illegal candidate wins on the hint or the hand; a degenerate chain returns null for the caller's fallback.
 * @evidence contracts/development/implementation.md#efficient-algorithms 720 candidates (360 swivels on two branches), each two decompositions, an overshoot and, with a rotation, the error's two decompositions.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input, called once per fit.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function fitHingedChainCandidate(
  props: IFitChainToTargetProps,
  prepared: NonNullable<ReturnType<typeof prepareChainPlant>>,
  axes: IAutoMovieJointAxes,
  rotation?: IAutoMovieQuaternion,
): IAutoMovieSolvedChainPlant | null {
  const turn: ((upper: IAutoMovieQuaternion, lower: IAutoMovieQuaternion) => number) | null =
    rotation === undefined ? null : fitHingedChainCandidate.error(props, prepared, axes, rotation);
  const root: IAutoMovieVector3 = prepared.upper.worldPosition;
  const reach: IAutoMovieVector3 = Vector3.subtract(props.target, root);
  if (Vector3.length(reach) < 1e-9) return null;
  const axis: IAutoMovieVector3 = Vector3.normalize(reach);
  const across = (p: IAutoMovieVector3): IAutoMovieVector3 => {
    const v: IAutoMovieVector3 = Vector3.subtract(p, root);
    return Vector3.subtract(v, Vector3.scale(axis, Vector3.dot(v, axis)));
  };
  const hint: IAutoMovieVector3 = across(props.bend ?? Vector3.add(root, { x: 0, y: -1, z: 0 }));
  const side: IAutoMovieVector3 | null = Vector3.length(hint) < 1e-9 ? null : Vector3.normalize(hint);
  const joints = (upper: IAutoMovieQuaternion, lower: IAutoMovieQuaternion): [IAutoMovieJointPose, IAutoMovieJointPose] => [
    { bone: props.chain.upper, ...decomposeJointRotation(upper, props.jointAxes?.[props.chain.upper], props.restFrames?.[props.chain.upper], prepared.upperDomain) },
    { bone: props.chain.lower, ...decomposeJointRotation(lower, axes, props.restFrames?.[props.chain.lower], prepared.lowerDomain) },
  ];
  const solved: ReturnType<typeof hingedArmArticulation> = hingedArmArticulation({
    upper: prepared.upper,
    midOffset: prepared.lowerOffset,
    midRest: prepared.lowerRotation,
    endOffset: prepared.effectorOffset,
    hinge: axes.flexion,
    target: props.target,
    score: (upper: IAutoMovieQuaternion, lower: IAutoMovieQuaternion): { overshoot: number; deviation: number } => {
      const [u, l] = joints(upper, lower);
      const mid: IAutoMovieVector3 = Vector3.add(root, Quaternion.rotateVector(Quaternion.multiply(prepared.upper.worldRotation, upper), prepared.lowerOffset));
      const offset: IAutoMovieVector3 = across(mid);
      const away: number = side === null || Vector3.length(offset) < 1e-9 ? 0 : 1 - Vector3.dot(Vector3.normalize(offset), side);
      const effort: number =
        clinicalDeviation({ flexion: u.flexion ?? 0, abduction: u.abduction ?? 0, twist: u.twist ?? 0 }) +
        clinicalDeviation({ flexion: l.flexion ?? 0, abduction: l.abduction ?? 0, twist: l.twist ?? 0 });
      return {
        overshoot: jointRomOvershoot(u, prepared.upperDomain.constraint) + jointRomOvershoot(l, prepared.lowerDomain.constraint),
        // The hand's reachable rotation ranks before the hint's side, in
        // tenths of a degree, so a swivel the wrist cannot follow loses.
        deviation: (turn === null ? 0 : 10 * Math.round(turn(upper, lower) / 0.1)) + away + 1e-9 * effort,
      };
    },
  });
  if (solved === null) return null;
  const [upper, lower] = joints(solved.upper, solved.lower);
  return { hinge: prepared.hinge, upper, lower };
}

/**
 * Companion of {@link fitHingedChainCandidate}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents its member.
 */
export namespace fitHingedChainCandidate {
  /**
   * How far, in degrees, the effector misses a requested rotation once a
   * hinged candidate's mid bone has taken its distal twist share and the
   * effector its swing, each clamped to the rig's range: the same split
   * `splitDistalTwist` and `orientEffector` then apply.
   *
   * @param props The fit request.
   * @param prepared The chain's preparation.
   * @param axes The mid bone's axes.
   * @param rotation The requested effector rotation.
   * @returns The error of a candidate's bone-local root and mid rotations.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the split it mirrors, the clamps and the unit.
   * @evidence contracts/development/implementation.md#principled-implementation Swing-twist decomposition about the mid bone's twist axis, then the clinical clamp of each joint, then the geodesic angle between rotations.
   */
  export function error(
    props: IFitChainToTargetProps,
    prepared: NonNullable<ReturnType<typeof prepareChainPlant>>,
    axes: IAutoMovieJointAxes,
    rotation: IAutoMovieQuaternion,
  ): (upper: IAutoMovieQuaternion, lower: IAutoMovieQuaternion) => number {
    const effector: AutoMovieHumanoidBone = props.chain.effector;
    const rest: IAutoMovieQuaternion = props.skeleton.bones.find((b): boolean => b.bone === effector)?.rest.rotation ?? Quaternion.identity();
    const effectorAxes: IAutoMovieJointAxes | undefined = props.jointAxes?.[effector];
    const twistAxis: IAutoMovieVector3 = Vector3.normalize(axes.twist);
    const clamped = (bone: AutoMovieHumanoidBone, q: IAutoMovieQuaternion, boneAxes: IAutoMovieJointAxes | undefined, domain?: Parameters<typeof decomposeJointRotation>[3]): IAutoMovieQuaternion => {
      const a: ReturnType<typeof decomposeJointRotation> = decomposeJointRotation(q, boneAxes, props.restFrames?.[bone], domain);
      return jointToQuaternion(clampJointToSkeleton({ bone, flexion: a.flexion, abduction: a.abduction, twist: a.twist }, props.skeleton), boneAxes, props.restFrames?.[bone]);
    };
    return (upper: IAutoMovieQuaternion, lower: IAutoMovieQuaternion): number => {
      const above: IAutoMovieQuaternion = Quaternion.multiply(Quaternion.multiply(prepared.upper.worldRotation, upper), prepared.lowerRotation);
      const needed: IAutoMovieQuaternion = Quaternion.normalize(Quaternion.multiply(Quaternion.inverse(Quaternion.multiply(above, lower)), rotation));
      const along: number = needed.x * twistAxis.x + needed.y * twistAxis.y + needed.z * twistAxis.z;
      const length: number = Math.hypot(along, needed.w);
      const twist: IAutoMovieQuaternion = length < 1e-12 ? Quaternion.identity() : { x: (twistAxis.x * along) / length, y: (twistAxis.y * along) / length, z: (twistAxis.z * along) / length, w: needed.w / length };
      const mid: IAutoMovieQuaternion = Quaternion.multiply(above, clamped(props.chain.lower, Quaternion.multiply(lower, twist), axes, prepared.lowerDomain));
      const local: IAutoMovieQuaternion = Quaternion.normalize(Quaternion.multiply(Quaternion.inverse(rest), Quaternion.multiply(Quaternion.inverse(mid), rotation)));
      const shown: IAutoMovieQuaternion = Quaternion.multiply(Quaternion.multiply(mid, rest), clamped(effector, local, effectorAxes));
      const dot: number = Math.min(1, Math.abs(shown.x * rotation.x + shown.y * rotation.y + shown.z * rotation.z + shown.w * rotation.w));
      return (2 * Math.acos(dot) * 180) / Math.PI;
    };
  }
}
