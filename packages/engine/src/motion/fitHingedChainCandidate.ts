import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMovieJointRotationDomain } from "../kinematics/IAutoMovieJointRotationDomain";
import type { IAutoMovieResolvedJointAngles } from "../kinematics/IAutoMovieResolvedJointAngles";
import { clinicalDeviation } from "../kinematics/clinicalDeviation";
import { DEFAULT_JOINT_AXES } from "../kinematics/constants/DEFAULT_JOINT_AXES";
import { decomposeJointRotationOnBasis } from "../kinematics/decomposeJointRotationOnBasis";
import { hingedArmArticulation } from "../kinematics/hingedArmArticulation";
import { jointRomOvershoot } from "../kinematics/jointRomOvershoot";
import { jointToQuaternion } from "../kinematics/jointToQuaternion";
import { normalizeJointAxes } from "../kinematics/normalizeJointAxes";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { swingTwist } from "../math/swingTwist";
import { clampJointToSkeleton } from "../rom/clampJointToSkeleton";
import type { IAutoMovieSolvedChainPlant } from "./IAutoMovieSolvedChainPlant";
import type { IFitChainToTargetProps } from "./IFitChainToTargetProps";
import type { prepareChainPlant } from "./prepareChainPlant";

/**
 * The hinged chain's candidate: `hingedArmArticulation`'s swivel sweep with
 * each candidate decomposed through the prepared clinical domains, scored
 * first by the rig's ROM overshoot plus the request's `obstruction` of the
 * candidate's mid and end joints, and then by one continuous cost: the
 * requested effector rotation's error in degrees (when one is requested),
 * plus two degrees per unit of the mid joint's swing away from the bend
 * hint's side of the root-to-target axis (`1 - cos`; without a hint, the side
 * the posed hinge already bends toward, see `posedSwing`), plus, when the
 * request carries a
 * `referencePose` (a grid-free reference such as the solution at a contact
 * event, never the previous frame, so a pose stays a pure function of time),
 * the degrees the root and mid joints turn away from it, with the clinical
 * effort as a vanishing tie-break. The cost is continuous in the target, so
 * the chosen swivel moves continuously as a target moves and jumps only where
 * two separate minima tie exactly; the reference term then decides the tie
 * toward the reference's side. The weights are provisional, as no source
 * fixes them: one degree of joint turn from the reference counts as much as
 * one degree of effector error (times the request's `referenceWeight`, 1
 * when omitted), so the reference's side is kept unless a
 * turn buys at least as much accuracy; and the
 * hint's side is worth 2 degrees per unit of `1 - cos` (4 degrees for the
 * opposite side), enough to decide between otherwise equal swivels while
 * never outweighing a visible effector error.
 *
 * @param props The fit request, with merged axes.
 * @param prepared The chain's preparation.
 * @param axes The mid bone's axes; its flexion is the hinge.
 * @param rotation A requested effector rotation, ranked before the hint's side when given.
 * @returns The candidate, or null for a degenerate chain.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the sweep, the overshoot-then-continuous-cost ranking with its terms and weights, the continuity premise and the frames of every input.
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
  const turn:
    | ((upper: IAutoMovieQuaternion, lower: IAutoMovieQuaternion) => number)
    | null =
    rotation === undefined
      ? null
      : rotationError(props, prepared, axes, rotation);
  const root: IAutoMovieVector3 = prepared.upper.worldPosition;
  const reach: IAutoMovieVector3 = Vector3.subtract(props.target, root);
  if (Vector3.length(reach) < 1e-9) return null;
  const axis: IAutoMovieVector3 = Vector3.normalize(reach);
  const across = (p: IAutoMovieVector3): IAutoMovieVector3 => {
    const v: IAutoMovieVector3 = Vector3.subtract(p, root);
    return Vector3.subtract(v, Vector3.scale(axis, Vector3.dot(v, axis)));
  };
  const hint: IAutoMovieVector3 = across(
    props.bend ?? Vector3.subtract(root, posedSwing(props, prepared, axes)),
  );
  const side: IAutoMovieVector3 | null =
    Vector3.length(hint) < 1e-9 ? null : Vector3.normalize(hint);
  // Each basis is admitted and normalized once for the whole sweep; the
  // candidates differ only in their rotation.
  const upperBasis: IAutoMovieJointAxes = basisOf(
    props.jointAxes?.[props.chain.upper],
  );
  const lowerBasis: IAutoMovieJointAxes = basisOf(axes);
  const joints = (
    upper: IAutoMovieQuaternion,
    lower: IAutoMovieQuaternion,
  ): [IAutoMovieJointPose, IAutoMovieJointPose] => [
    {
      bone: props.chain.upper,
      ...decomposeJointRotationOnBasis(
        upper,
        upperBasis,
        props.restFrames?.[props.chain.upper],
        prepared.upperDomain,
      ),
    },
    {
      bone: props.chain.lower,
      ...decomposeJointRotationOnBasis(
        lower,
        lowerBasis,
        props.restFrames?.[props.chain.lower],
        prepared.lowerDomain,
      ),
    },
  ];
  const previous = (bone: string): IAutoMovieQuaternion | null => {
    const joint: IAutoMovieJointPose | undefined =
      props.referencePose?.joints.find(
        (j: IAutoMovieJointPose): boolean => j.bone === bone,
      );
    return joint === undefined
      ? null
      : Quaternion.normalize(
          jointToQuaternion(
            joint,
            bone === props.chain.lower
              ? axes
              : props.jointAxes?.[props.chain.upper],
            props.restFrames?.[joint.bone],
          ),
        );
  };
  const before: [IAutoMovieQuaternion | null, IAutoMovieQuaternion | null] = [
    previous(props.chain.upper),
    previous(props.chain.lower),
  ];
  const anchor: number = props.referenceWeight ?? 1;
  if (!Number.isFinite(anchor) || anchor < 0)
    throw new Error(
      `fitChainToTarget referenceWeight must be finite and non-negative, but was ${anchor}`,
    );
  const apart = (
    a: IAutoMovieQuaternion,
    b: IAutoMovieQuaternion | null,
  ): number => (b === null ? 0 : (Quaternion.angle(a, b) * 180) / Math.PI);
  const range: { min: number; max: number } | null = hingeRange(
    props,
    prepared,
    axes,
    lowerBasis,
  );
  const solved: ReturnType<typeof hingedArmArticulation> =
    hingedArmArticulation({
      upper: prepared.upper,
      midOffset: prepared.lowerOffset,
      midRest: prepared.lowerRotation,
      endOffset: prepared.effectorOffset,
      hinge: axes.flexion,
      target: props.target,
      ...(range === null ? {} : { range }),
      score: (
        upper: IAutoMovieQuaternion,
        lower: IAutoMovieQuaternion,
      ): { overshoot: number; deviation: number } => {
        const [u, l] = joints(upper, lower);
        const mid: IAutoMovieVector3 = Vector3.add(
          root,
          Quaternion.rotateVector(
            Quaternion.multiply(prepared.upper.worldRotation, upper),
            prepared.lowerOffset,
          ),
        );
        const blocked: number =
          props.obstruction === undefined
            ? 0
            : props.obstruction(
                mid,
                Vector3.add(
                  mid,
                  Quaternion.rotateVector(
                    Quaternion.multiply(
                      Quaternion.multiply(
                        Quaternion.multiply(
                          prepared.upper.worldRotation,
                          upper,
                        ),
                        prepared.lowerRotation,
                      ),
                      lower,
                    ),
                    prepared.effectorOffset,
                  ),
                ),
              );
        const offset: IAutoMovieVector3 = across(mid);
        const away: number =
          side === null || Vector3.length(offset) < 1e-9
            ? 0
            : 1 - Vector3.dot(Vector3.normalize(offset), side);
        const effort: number =
          clinicalDeviation({
            flexion: u.flexion ?? 0,
            abduction: u.abduction ?? 0,
            twist: u.twist ?? 0,
          }) +
          clinicalDeviation({
            flexion: l.flexion ?? 0,
            abduction: l.abduction ?? 0,
            twist: l.twist ?? 0,
          });
        return {
          overshoot:
            jointRomOvershoot(u, prepared.upperDomain.constraint) +
            jointRomOvershoot(l, prepared.lowerDomain.constraint) +
            blocked,
          deviation:
            (turn === null ? 0 : turn(upper, lower)) +
            2 * away +
            anchor *
              (apart(Quaternion.normalize(upper), before[0]) +
                apart(Quaternion.normalize(lower), before[1])) +
            1e-9 * effort,
        };
      },
    });
  if (solved === null) return null;
  const [upper, lower] = joints(solved.upper, solved.lower);
  return {
    hinge: prepared.hinge,
    upper,
    lower,
    shortfall: solved.shortfall,
  };
}

/**
 * The mid joint's flexion range as rotation about its own hinge, radians:
 * what `hingedArmArticulation` takes as `range`. The clinical flexion of a
 * pure hinge rotation is linear in the hinge angle, with a sign and an offset
 * that differ between an elbow and a knee and between rigs, so both are read
 * numerically from the principal decomposition at zero and at one degree
 * rather than assumed.
 *
 * @param props The fit request.
 * @param prepared The chain's preparation; its lower domain carries the range.
 * @param axes The mid bone's axes; its flexion is the hinge.
 * @param basis The mid bone's normalized basis.
 * @returns The range, or null when the joint has no flexion range to keep or the reading is degenerate.
 */
function hingeRange(
  props: IFitChainToTargetProps,
  prepared: NonNullable<ReturnType<typeof prepareChainPlant>>,
  axes: IAutoMovieJointAxes,
  basis: IAutoMovieJointAxes,
): { min: number; max: number } | null {
  const flexion: { min: number; max: number } | null | undefined =
    prepared.lowerDomain.constraint?.flexion;
  if (flexion === null || flexion === undefined) return null;
  const length: number = Vector3.length(axes.flexion);
  if (length < 1e-6) return null;
  const hinge: IAutoMovieVector3 = Vector3.scale(axes.flexion, 1 / length);
  const read = (degrees: number): number =>
    decomposeJointRotationOnBasis(
      Quaternion.fromAxisAngle(hinge, degrees),
      basis,
      props.restFrames?.[props.chain.lower],
    ).flexion ?? 0;
  const offset: number = read(0);
  const slope: number = read(1) - offset;
  if (Math.abs(Math.abs(slope) - 1) > 1e-6) return null;
  const ends: [number, number] = [
    (flexion.min - offset) / slope,
    (flexion.max - offset) / slope,
  ];
  return {
    min: (Math.min(...ends) * Math.PI) / 180,
    max: (Math.max(...ends) * Math.PI) / 180,
  };
}

/**
 * A joint's clinical basis as `decomposeJointRotationOnBasis` reads it: the
 * given axes, or the default ones, admitted and normalized exactly as
 * `decomposeJointRotation` would for each call, done here once per fit.
 *
 * @param axes The bone's clinical axes; omitted, the default basis.
 * @returns The orthonormal basis.
 */
function basisOf(axes: IAutoMovieJointAxes | undefined): IAutoMovieJointAxes {
  return normalizeJointAxes(
    axes ?? DEFAULT_JOINT_AXES,
    "decomposeJointRotation axes",
  );
}

/**
 * How far, in degrees, the effector misses a requested rotation once a
 * hinged candidate's mid bone has taken its distal twist share and the
 * effector its swing, each clamped to the rig's range: the split that
 * `splitDistalTwist` and `orientChainEffector` later apply to the chosen
 * candidate, evaluated here for every candidate so the ranking sees the
 * hand the fit will actually show. The twist share comes from the engine's
 * single swing-twist owner (`swingTwist`); each joint is clamped through its
 * clinical domain as the fit clamps it; the error is the geodesic angle
 * between the shown and the requested rotation, from `Quaternion.angle`,
 * which stays exact for an error near zero so the swivel refinement settles
 * on mirrored swivels for mirrored requests.
 *
 * @param props The fit request.
 * @param prepared The chain's preparation.
 * @param axes The mid bone's axes.
 * @param rotation The requested effector rotation.
 * @returns The error of a candidate's bone-local root and mid rotations.
 */
function rotationError(
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
  const clamped = (
    bone: AutoMovieHumanoidBone,
    q: IAutoMovieQuaternion,
    boneAxes: IAutoMovieJointAxes | undefined,
    basis: IAutoMovieJointAxes,
    domain?: IAutoMovieJointRotationDomain,
  ): IAutoMovieQuaternion => {
    const a: IAutoMovieResolvedJointAngles = decomposeJointRotationOnBasis(
      q,
      basis,
      props.restFrames?.[bone],
      domain,
    );
    return jointToQuaternion(
      clampJointToSkeleton(
        { bone, flexion: a.flexion, abduction: a.abduction, twist: a.twist },
        props.skeleton,
      ),
      boneAxes,
      props.restFrames?.[bone],
    );
  };
  const wanted: IAutoMovieQuaternion = Quaternion.normalize(rotation);
  return (upper: IAutoMovieQuaternion, lower: IAutoMovieQuaternion): number => {
    const above: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.multiply(prepared.upper.worldRotation, upper),
      prepared.lowerRotation,
    );
    const needed: IAutoMovieQuaternion = Quaternion.normalize(
      Quaternion.multiply(
        Quaternion.inverse(Quaternion.multiply(above, lower)),
        rotation,
      ),
    );
    // The share the mid bone takes, exactly as splitDistalTwist assigns it.
    const { twist } = swingTwist(needed, axes.twist);
    const mid: IAutoMovieQuaternion = Quaternion.multiply(
      above,
      clamped(
        props.chain.lower,
        Quaternion.multiply(lower, twist),
        axes,
        lowerBasis,
        prepared.lowerDomain,
      ),
    );
    const local: IAutoMovieQuaternion = Quaternion.normalize(
      Quaternion.multiply(
        Quaternion.inverse(rest),
        Quaternion.multiply(Quaternion.inverse(mid), rotation),
      ),
    );
    const shown: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.multiply(mid, rest),
      clamped(effector, local, effectorAxes, effectorBasis),
    );
    return (
      (Quaternion.angle(Quaternion.normalize(shown), wanted) * 180) / Math.PI
    );
  };
}

/**
 * Which way the end of the chain swings when its posed hinge flexes one more
 * degree, as a world vector: the side a hinged chain keeps when the request
 * names no bend hint. The mid joint lies opposite the swing across the
 * root-to-end line, so `root - swing` is the hint point.
 *
 * Without a pole, analytic two-bone IK keeps the chain's current bend plane
 * (Unity's TwoBoneIKConstraint without a hint, Maya's ikRPsolver with a zero
 * pole vector), because the pose being fitted already says how the limb is
 * turned. World-down, the textbook arm default, fails for a standing leg: it
 * lies almost along the hip-to-ankle axis, so its component across that axis
 * is tiny, turns with every millimetre the foot moves and flips the knee
 * between frames, which a planted walk on a slope showed as a 1066 degree per
 * second thigh twist. The posed hinge instead gives a definite side even for
 * a straight limb, since flexion always swings the end about the hinge's own
 * axis, and it moves only as continuously as the authored pose does.
 *
 * Reading the swing numerically (forward kinematics at the posed flexion and
 * one degree more) needs no sign convention for the hinge axis, which differs
 * between an elbow and a knee and between rigs.
 *
 * @param props The fit request; its pose supplies the posed root and mid joints, rest when absent.
 * @param prepared The chain's preparation.
 * @param axes The mid bone's axes; its flexion is the hinge.
 * @returns The end's displacement, model metres.
 */
function posedSwing(
  props: IFitChainToTargetProps,
  prepared: NonNullable<ReturnType<typeof prepareChainPlant>>,
  axes: IAutoMovieJointAxes,
): IAutoMovieVector3 {
  const posed = (bone: IAutoMovieJointPose["bone"]): IAutoMovieJointPose =>
    props.pose.joints.find(
      (j: IAutoMovieJointPose): boolean => j.bone === bone,
    ) ?? {
      bone,
      flexion: 0,
      abduction: 0,
      twist: 0,
    };
  const upperJoint: IAutoMovieJointPose = posed(props.chain.upper);
  const lowerJoint: IAutoMovieJointPose = posed(props.chain.lower);
  const above: IAutoMovieQuaternion = Quaternion.multiply(
    prepared.upper.worldRotation,
    jointToQuaternion(
      upperJoint,
      props.jointAxes?.[props.chain.upper],
      props.restFrames?.[props.chain.upper],
    ),
  );
  const mid: IAutoMovieVector3 = Vector3.add(
    prepared.upper.worldPosition,
    Quaternion.rotateVector(above, prepared.lowerOffset),
  );
  const end = (flexion: number): IAutoMovieVector3 =>
    Vector3.add(
      mid,
      Quaternion.rotateVector(
        Quaternion.multiply(
          Quaternion.multiply(above, prepared.lowerRotation),
          jointToQuaternion(
            { ...lowerJoint, flexion },
            axes,
            props.restFrames?.[props.chain.lower],
          ),
        ),
        prepared.effectorOffset,
      ),
    );
  const flexion: number = lowerJoint.flexion ?? 0;
  return Vector3.subtract(end(flexion + 1), end(flexion));
}
