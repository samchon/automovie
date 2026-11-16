import type {
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { boxExcludedSwivels } from "../kinematics/boxExcludedSwivels";
import { clinicalDeviation } from "../kinematics/clinicalDeviation";
import { decomposeJointRotationOnBasis } from "../kinematics/decomposeJointRotationOnBasis";
import { hingedArmArticulation } from "../kinematics/hingedArmArticulation";
import { jointRomOvershoot } from "../kinematics/jointRomOvershoot";
import { jointToQuaternion } from "../kinematics/jointToQuaternion";
import { swingTwistRange } from "../kinematics/swingTwistRange";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { ROM_TOLERANCE } from "../rom/constants/ROM_TOLERANCE";
import type { IAutoMovieSolvedChainPlant } from "./IAutoMovieSolvedChainPlant";
import type { IFitChainToTargetProps } from "./IFitChainToTargetProps";
import { basisOf } from "./basisOf";
import { fitHingedRotationError } from "./fitHingedRotationError";
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
 * never outweighing a visible effector error. A request continuing a nearby
 * fit (`near`) refines that fit's seed instead of sweeping, and the candidate
 * carries the seed it was chosen at. A request with a `strain` ranks the
 * swivels by task priority instead (Siciliano and Slotine 1991): legality,
 * then the hand's rotation error, two errors within the joints' tolerance
 * (`ROM_TOLERANCE`) being one, then the turn from a `referencePose` when one
 * is given (which keeps a stroke's side), else the strain, with no bend
 * hint; the
 * candidate carries the value it was chosen by, so a caller ranking keys by
 * their fits reads one continuous value (Berge's maximum theorem) instead
 * of a measure taken at another search's argmin.
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
 * @evidence contracts/development/implementation.md#efficient-algorithms hingedArmArticulation supplies at most 720 coarse swivel samples plus its bounded per-minimum refinements, or only the continued seed's refinement. Each score reads the root angles and overshoot; a rotation's exact error is evaluated lazily when the comparison bound needs it. That read uses fitHingedRotationError's at most five distal projector queries plus one final query: at most six queries of nineteen actual joint scores each for an eligible box, or its retained four-sweep, forty-step-per-axis fallback of at most 528 recompositions per query. The shared lower quaternion reuses its angles, overshoot, effort and reference turn per branch. Certified refused swivels remain pruned; caller obstruction/strain work remains additional, and no runtime speedup is measured.
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
      : fitHingedRotationError(props, prepared, axes, rotation);
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
    midOf(lower).joint,
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
  // A sweep's candidates on one bend branch share one mid rotation, the
  // same record, and differ only in the swivel of the root. What depends on
  // the mid rotation alone is read once per record: the same values, read
  // once instead of per candidate.
  let mid: IMid | undefined;
  const midOf = (lower: IAutoMovieQuaternion): IMid => {
    if (mid !== undefined && mid.rotation === lower) return mid;
    const joint: IAutoMovieJointPose = {
      bone: props.chain.lower,
      ...decomposeJointRotationOnBasis(
        lower,
        lowerBasis,
        props.restFrames?.[props.chain.lower],
        prepared.lowerDomain,
      ),
    };
    mid = {
      rotation: lower,
      joint,
      overshoot: jointRomOvershoot(joint, prepared.lowerDomain.constraint),
      effort: clinicalDeviation({
        flexion: joint.flexion ?? 0,
        abduction: joint.abduction ?? 0,
        twist: joint.twist ?? 0,
      }),
      turned: apart(Quaternion.normalize(lower), before[1]),
    };
    return mid;
  };
  const range: { min: number; max: number } | null = hingeRange(
    props,
    prepared,
    axes,
    lowerBasis,
  );
  // What a candidate reads besides the hint's side: its root's angles, its
  // mid joint's place, its overshoot, effort and turn from the reference.
  const reading = (
    upper: IAutoMovieQuaternion,
    lower: IAutoMovieQuaternion,
  ): IReading => {
    const [u] = joints(upper, lower);
    const turnedUpper: IAutoMovieQuaternion = Quaternion.multiply(
      prepared.upper.worldRotation,
      upper,
    );
    const lowerWorld: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.multiply(turnedUpper, prepared.lowerRotation),
      lower,
    );
    const mid: IAutoMovieVector3 = Vector3.add(
      root,
      Quaternion.rotateVector(turnedUpper, prepared.lowerOffset),
    );
    const blocked: number =
      props.obstruction === undefined
        ? 0
        : props.obstruction(
            mid,
            Vector3.add(
              mid,
              Quaternion.rotateVector(lowerWorld, prepared.effectorOffset),
            ),
          );
    const known: IMid = midOf(lower);
    return {
      mid,
      lowerWorld,
      effort:
        clinicalDeviation({
          flexion: u.flexion ?? 0,
          abduction: u.abduction ?? 0,
          twist: u.twist ?? 0,
        }) + known.effort,
      overshoot:
        jointRomOvershoot(u, prepared.upperDomain.constraint) +
        known.overshoot +
        blocked,
      turned:
        anchor * (apart(Quaternion.normalize(upper), before[0]) + known.turned),
    };
  };
  // With a strain the swivels are ranked by task priority (Siciliano and
  // Slotine 1991): legality, then the hand's rotation error, errors within
  // the joints' tolerance (`ROM_TOLERANCE`) being one, then the strain; the
  // bend hint's side plays no part.
  const strain:
    | ((
        upper: IAutoMovieQuaternion,
        lower: IAutoMovieQuaternion,
        lowerWorld: IAutoMovieQuaternion,
      ) => number)
    | undefined = props.strain;
  const solved: ReturnType<typeof hingedArmArticulation> =
    hingedArmArticulation({
      upper: prepared.upper,
      midOffset: prepared.lowerOffset,
      midRest: prepared.lowerRotation,
      endOffset: prepared.effectorOffset,
      hinge: axes.flexion,
      target: props.target,
      ...(range === null ? {} : { range }),
      // A fit of a nearby target continued from its seed refines that seed
      // alone (`IAutoMovieSwivelNear`).
      ...(props.near === undefined ? {} : { near: props.near }),
      ...(strain === undefined ? {} : { tie: ROM_TOLERANCE }),
      // The root's box, or its swing-twist range, refuses swivels its
      // overshoot can only score above zero, so the sweep spares them
      // (`boxExcludedSwivels`). The range is read in the frame
      // `jointRomOvershoot` reads it in without a rig.
      excluded: (
        upper: (swivel: number) => IAutoMovieQuaternion,
      ): ((low: number, high: number) => boolean) =>
        boxExcludedSwivels({
          basis: upperBasis,
          frame: props.restFrames?.[props.chain.upper],
          constraint: prepared.upperDomain.constraint,
          joint: swingTwistRange.of(props.chain.upper),
          rotation: upper,
        }),
      score: (
        upper: IAutoMovieQuaternion,
        lower: IAutoMovieQuaternion,
      ): {
        overshoot: number;
        deviation: number;
        exact?: () => number;
        tiebreak?: () => number;
      } => {
        const { mid, lowerWorld, effort, overshoot, turned }: IReading =
          reading(upper, lower);
        if (strain !== undefined)
          return {
            overshoot,
            deviation: 0,
            ...(turn === null
              ? {}
              : { exact: (): number => turn(upper, lower) }),
            // A reference pose keeps its side through a stroke, so its turn
            // decides before the strain; without one the strain decides.
            tiebreak: (): number =>
              props.referencePose === undefined
                ? strain(upper, lower, lowerWorld)
                : turned,
          };
        // The hint's side weighs as the mid joint leaves the line to the
        // target: a straight limb has no side, and a rounding-sized offset's
        // direction must not rank swivels.
        const offset: IAutoMovieVector3 = across(mid);
        const off: number = Vector3.length(offset);
        const away: number =
          side === null || off < 1e-12
            ? 0
            : (1 - Vector3.dot(Vector3.scale(offset, 1 / off), side)) *
              Math.min(1, off / SIDED);
        // The effector's error is the costly term and is never negative, so
        // the sum without it, added in the same order, is a lower bound of
        // the tie-break (rounding is monotone), and the error is computed
        // only for a comparison the bound cannot decide.
        if (turn === null)
          return {
            overshoot,
            deviation: 0 + 2 * away + turned + 1e-9 * effort,
          };
        return {
          overshoot,
          deviation: 0 + 2 * away + turned + 1e-9 * effort,
          exact: (): number =>
            turn(upper, lower) + 2 * away + turned + 1e-9 * effort,
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
    seed: { swivel: solved.swivel, branch: solved.branch },
    ...(strain === undefined
      ? {}
      : {
          value: {
            overshoot: solved.overshoot,
            error: solved.deviation,
            strain: solved.second ?? 0,
          },
        }),
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

/** The mid joint's distance from the line to the target, metres, from which the bend hint's side weighs in full (provisional: a millimetre, past any rounding of a limb's joints and short of any bend one sees). */
const SIDED: number = 1e-3;

/** What a candidate reads of its mid rotation alone, read once per rotation record. */
interface IMid {
  /** The mid rotation the values were read from. */
  rotation: IAutoMovieQuaternion;

  /** Its clinical angles. */
  joint: IAutoMovieJointPose;

  /** Their ROM overshoot, degrees. */
  overshoot: number;

  /** Their clinical effort. */
  effort: number;

  /** Degrees the mid joint turns from the reference pose's; 0 without one. */
  turned: number;
}

/** What a candidate reads besides the hint's side, read once per candidate of a fit with a strain. */
interface IReading {
  /** The mid joint's place, world metres. */
  mid: IAutoMovieVector3;

  /** The mid bone's world rotation. */
  lowerWorld: IAutoMovieQuaternion;

  /** The root's and the mid joint's clinical effort. */
  effort: number;

  /** The ROM overshoot of both joints plus the obstruction, degrees. */
  overshoot: number;

  /** Degrees both joints turn from the reference pose's, weighed. */
  turned: number;
}
