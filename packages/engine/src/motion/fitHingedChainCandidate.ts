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
import type { hingedArmSwivel } from "../kinematics/hingedArmSwivel";
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
import { hingedChainSide } from "./hingedChainSide";
import { hingedRotationStart } from "./hingedRotationStart";
import { posedHingeSwing } from "./posedHingeSwing";
import { readHingeRange } from "./readHingeRange";
import type { prepareChainFit } from "./prepareChainFit";
import type { prepareChainPlant } from "./prepareChainPlant";

/**
 * The hinged chain's candidate: `hingedArmArticulation`'s swivel sweep with
 * each candidate decomposed through the prepared clinical domains, scored
 * first by the rig's ROM overshoot plus the request's `obstruction` of the
 * candidate's mid and end joints, and then by one continuous cost: the
 * requested effector rotation's error in degrees (when one is requested),
 * plus two degrees per unit of the mid joint's swing away from the bend
 * hint's side of the root-to-target axis (`1 - cos`; without a hint, the side
 * the posed hinge already bends toward, see `posedHingeSwing`), plus, when the
 * request carries a
 * `referencePose` (a grid-free reference such as the solution at a contact
 * event, never the previous frame, so a pose stays a pure function of time),
 * the degrees the root and mid joints turn away from it, with the clinical
 * effort as a vanishing tie-break. The cost is continuous in the target, so
 * the chosen swivel moves continuously as a target moves and jumps only where
 * two separate minima tie exactly; the reference term then decides the tie
 * toward the reference's side. The weights are provisional, as no source
 * fixes them. Under this continuous cost the cold fit starts in closed form:
 * without a requested rotation at the side term's peak, the pole of two-bone
 * IK (`hingedChainSide.peak`), which alone answers when no reference or
 * obstruction is asked; with one, on a limb whose mid joint takes no distal
 * twist, at the swivel needing the least end-joint articulation. It searches
 * locally and keeps a legal result whose rotation is met; the full sweep
 * runs otherwise, when the limb has no side, and for a distal-twist limb
 * with a rotation.
 * One degree of joint turn from the reference counts as much as
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
 * @param rig Optional lazy rig of the same unchanged source workspace; source-only basis, reference, hinge range and posed swing may be shared, while every candidate score and callback remains target-local.
 * @returns The candidate, or null for a degenerate chain.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the sweep, the overshoot-then-continuous-cost ranking with its terms and weights, the continuity premise and the frames of every input.
 * @evidence contracts/development/implementation.md#principled-implementation The swivel parameterisation of Tolani, Goswami and Badler 2000 through hingedArmArticulation, scored through actual clinical decomposition and ROM overshoot. The mid joint circles the root-to-target axis as the swivel turns, so the side term is a sinusoid whose peak is the pole direction in closed form; the local search then minimises the full score in that basin. Without strain, obstruction, reference or a hint side, every raw cost term is non-negative: ROM excess, quaternion angle and squared clinical effort. A zero global lower bound then certifies only an exact-zero original first candidate, retaining its original tie and seed.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One scoring closure over hingedArmArticulation's sweep; the effector error is a separate member.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Overshoot ranks first, so no illegal candidate wins on the hint or the hand; a degenerate chain returns null for the caller's fallback.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cold/near swivel search dominates, with root clinical/legality reads per candidate and branch-shared lower metadata. Eligibility for a closed-form start is exactly no strain and no minimum certificate, with either no requested rotation and a hint side (the pole; one score per branch when neither reference nor obstruction is asked and the pole is unrefused), or a requested rotation on a mid joint without distal twist (the least-articulation swivel). The local search scores the start, its two neighbours, each further downhill step and one refinement per branch. The full sweep runs when the best branch result keeps an overshoot (range or obstruction), when a rotation start leaves the rotation error above ROM_TOLERANCE degrees, when the limb is straight to within rounding, and for every distal-twist limb with a rotation. An exact-zero first candidate can end cold search only under its certified nonnegative objective; other searches remain. An absent hint side and obstruction need no midpoint FK or cross-axis vectors. Task priority omits unused effort; a reference-only second key needs no unused world prefix. Reference geodesic/strain composition remain lazy. Rotation keeps its existing distal/fallback work. No speedup is measured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A supplied lazy workspace shares admitted bases, fixed references/weight, hinge range and posed source swing at the same first-use sites. A candidate reads its upper joint and shared lower record once without a discarded joint-pair array; an absent reference needs no unused quaternion normalization. Its already computed lower-preceding world frame also serves its rotation scorer in the original grouping. Source dependencies stay unchanged; target readings, scores, seed selection and caller callbacks still run per target. Standalone callers retain original setup and recomputation fallback.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns any borrowed workspace rig; this target's scoring closures and bounded sweep data are released when the search returns. Only the selected candidate escapes, and no target history, handle or background task is retained.
 */
export function fitHingedChainCandidate(
  props: IFitChainToTargetProps,
  prepared: NonNullable<ReturnType<typeof prepareChainPlant>>,
  axes: IAutoMovieJointAxes,
  rotation?: IAutoMovieQuaternion,
  rig?: prepareChainFit.IRig,
): IAutoMovieSolvedChainPlant | null {
  const turn:
    | ((upper: IAutoMovieQuaternion, lower: IAutoMovieQuaternion, preparedAbove?: IAutoMovieQuaternion) => number)
    | null =
    rotation === undefined
      ? null
      : fitHingedRotationError(props, prepared, axes, rotation, rig);
  const root: IAutoMovieVector3 = prepared.upper.worldPosition;
  const reach: IAutoMovieVector3 = Vector3.subtract(props.target, root);
  if (Vector3.length(reach) < 1e-9) return null;
  const axis: IAutoMovieVector3 = Vector3.normalize(reach);
  const across = (p: IAutoMovieVector3): IAutoMovieVector3 => {
    const v: IAutoMovieVector3 = Vector3.subtract(p, root);
    return Vector3.subtract(v, Vector3.scale(axis, Vector3.dot(v, axis)));
  };
  const hint: IAutoMovieVector3 = across(
    props.bend ??
      Vector3.subtract(
        root,
        rig === undefined
          ? posedHingeSwing(props, prepared, axes)
          : rig.posedSwing(
              (): IAutoMovieVector3 => posedHingeSwing(props, prepared, axes),
            ),
      ),
  );
  const side: IAutoMovieVector3 | null =
    Vector3.length(hint) < 1e-9 ? null : Vector3.normalize(hint);

  // The mid joint's offset across the root-to-target axis at a swivel of a
  // branch whose root rotation `upper` gives, read by the side bound and pole.
  const offsetOf = (
    upper: (swivel: number) => IAutoMovieQuaternion,
  ): ((swivel: number) => IAutoMovieVector3) =>
    (swivel: number): IAutoMovieVector3 =>
      across(Vector3.add(root, Quaternion.rotateVector(
        Quaternion.multiply(prepared.upper.worldRotation, upper(swivel)), prepared.lowerOffset)));
  // Each basis is admitted and normalized once for the whole sweep; the
  // candidates differ only in their rotation.
  const upperBasis: IAutoMovieJointAxes =
    rig?.basis(props.chain.upper, "decomposeJointRotation axes") ??
    basisOf(props.jointAxes?.[props.chain.upper]);
  const lowerBasis: IAutoMovieJointAxes =
    rig?.basis(props.chain.lower, "decomposeJointRotation axes") ??
    basisOf(axes);
  const upperOf = (
    upper: IAutoMovieQuaternion,
  ): IAutoMovieJointPose => ({
      bone: props.chain.upper,
      ...decomposeJointRotationOnBasis(
        upper,
        upperBasis,
        props.restFrames?.[props.chain.upper],
        prepared.upperDomain,
      ),
  });
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
    rig === undefined
      ? previous(props.chain.upper)
      : rig.reference(props.chain.upper),
    rig === undefined
      ? previous(props.chain.lower)
      : rig.reference(props.chain.lower),
  ];
  const anchor: number = rig?.referenceWeight() ?? props.referenceWeight ?? 1;
  if (rig === undefined && (!Number.isFinite(anchor) || anchor < 0))
    throw new Error(
      `fitChainToTarget referenceWeight must be finite and non-negative, but was ${anchor}`,
    );
  const apart = (
    a: IAutoMovieQuaternion,
    b: IAutoMovieQuaternion | null,
  ): number => (b === null ? 0 : (Quaternion.angleAfterNormalize(a, b) * 180) / Math.PI);

  // The gate reads canonical scoring frames when no rig is supplied. Their
  // axes, clinical frame and constraint are fixed for every swivel here.
  const upperOvershoot: (joint: IAutoMovieJointPose) => number =
    rig?.overshoot(props.chain.upper) ??
    jointRomOvershoot.prepare(props.chain.upper, prepared.upperDomain.constraint);
  const lowerOvershoot: (joint: IAutoMovieJointPose) => number =
    rig?.overshoot(props.chain.lower) ??
    jointRomOvershoot.prepare(props.chain.lower, prepared.lowerDomain.constraint);
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
      overshoot: lowerOvershoot(joint),
      effort: clinicalDeviation({
        flexion: joint.flexion ?? 0,
        abduction: joint.abduction ?? 0,
        twist: joint.twist ?? 0,
      }),
      turned: apart(lower, before[1]),
    };
    return mid;
  };
  const range: { min: number; max: number } | null =
    rig === undefined
      ? readHingeRange(props, prepared, axes, lowerBasis)
      : rig.hingeRange((): { min: number; max: number } | null =>
          readHingeRange(props, prepared, axes, lowerBasis),
        );
  // What a candidate reads besides the hint's side: its root's angles, its
  // mid joint's place, its overshoot, effort and turn from the reference.
  const reading = (
    upper: IAutoMovieQuaternion,
    lower: IAutoMovieQuaternion,
  ): IReading => {
    const u: IAutoMovieJointPose = upperOf(upper);
    const known: IMid = midOf(lower);

    // Task priority reads no hint midpoint. A reference also replaces its
    // strain callback, leaving world frames only to rotation or obstruction.
    const needsMid: boolean = props.obstruction !== undefined ||
      (strain === undefined && side !== null);
    const needsAbove: boolean = props.obstruction !== undefined || turn !== null ||
      (strain !== undefined && props.referencePose === undefined);
    const turnedUpper: IAutoMovieQuaternion | undefined = needsMid || needsAbove
      ? Quaternion.multiply(prepared.upper.worldRotation, upper) : undefined;
    const above: IAutoMovieQuaternion | undefined =
      needsAbove ? Quaternion.multiply(turnedUpper!, prepared.lowerRotation) : undefined;
    const lowerWorld: IAutoMovieQuaternion | undefined =
      props.obstruction === undefined
        ? undefined : Quaternion.multiply(above!, lower);
    const mid: IAutoMovieVector3 | undefined = needsMid ? Vector3.add(
      root,
      Quaternion.rotateVector(turnedUpper!, prepared.lowerOffset),
    ) : undefined;
    const blocked: number =
      props.obstruction === undefined
        ? 0
        : props.obstruction(
            mid!,
            Vector3.add(
              mid!,
              Quaternion.rotateVector(lowerWorld!, prepared.effectorOffset),
            ),
          );
    return {
      mid,
      above,
      lowerWorld,
      effort:
        strain === undefined ? clinicalDeviation({
          flexion: u.flexion ?? 0,
          abduction: u.abduction ?? 0,
          twist: u.twist ?? 0,
        }) + known.effort : 0,
      overshoot:
        upperOvershoot(u) +
        known.overshoot +
        blocked,
      turned:
        strain === undefined ? anchor * (apart(upper, before[0]) + known.turned) : 0,
      midTurn: known.turned,
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
      ...(rig === undefined ? {} : {
        prepared: rig.hingedGeometry()?.target(props.target, range ?? undefined),
      }),
      // A fit of a nearby target continued from its seed refines that seed
      // alone (`IAutoMovieSwivelNear`).
      ...(props.near === undefined ? {} : { near: props.near }),
      ...(strain === undefined ? {} : { tie: ROM_TOLERANCE }),
      // With no hint side, reference or obstruction, every actual term is
      // non-negative in the original arithmetic: ROM excess, rotation angle
      // and squared clinical effort. An exact-zero original first candidate
      // cannot be improved, including by the later local refinements.
      ...(strain === undefined && props.obstruction === undefined &&
        props.referencePose === undefined && side === null
        ? { minimum: { overshoot: 0, deviation: 0 } } : {}),
      // The root's box, or its swing-twist range, refuses swivels its
      // overshoot can only score above zero, so the sweep spares them
      // (`boxExcludedSwivels`). The range is read in the frame
      // `jointRomOvershoot` reads it in without a rig.
      // Under the continuous cost every term of the deviation is
      // non-negative, so twice the hint-side term is a lower bound of it; the
      // mid joint circles the root-to-target axis as the swivel turns, so
      // that term is a sinusoid of the swivel, bounded over an interval in
      // closed form (`hingedChainSide.bound`), and the sweep scores only the swivels the
      // bound leaves open (`hingedSwivelBounded`).
      ...(strain === undefined && side !== null
        ? {
            bound: (
              upper: (swivel: number) => IAutoMovieQuaternion,
            ): ((low: number, high: number) => number) =>
              hingedChainSide.bound(offsetOf(upper), side),
          }
        : {}),
      // The closed-form start of the local search (`hingedSwivelPole`):
      // without a requested rotation, the side sinusoid's peak, the pole of
      // two-bone IK, which is the whole score's minimiser when no reference
      // or obstruction is asked (`direct`, the clinical effort's 1e-9
      // tie-break aside); with one on a limb whose mid joint takes no distal
      // twist, the swivel that needs the least end-joint articulation
      // (`hingedRotationStart`), accepted only when the rotation is then met.
      // Either way the sweep decides what the local result leaves unmet.
      ...(strain !== undefined
        ? {}
        : turn === null
          ? side === null
            ? {}
            : {
                pole: (posed: ReturnType<typeof hingedArmSwivel.pose>): number | null =>
                  hingedChainSide.peak(offsetOf((swivel: number): IAutoMovieQuaternion => posed(swivel).upper), side),
                ...(props.referencePose === undefined && props.obstruction === undefined ? { direct: true } : {}),
              }
          : lowerBasis.twistPlacement === "distal" || rotation === undefined
            ? {}
            : {
                pole: (posed: ReturnType<typeof hingedArmSwivel.pose>): number | null =>
                  hingedRotationStart(prepared, posed, rotation!),
                met: (upper: IAutoMovieQuaternion, lower: IAutoMovieQuaternion): boolean =>
                  turn!(upper, lower) <= ROM_TOLERANCE,
              }),
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
        const { mid, above, lowerWorld, effort, overshoot, turned, midTurn }: IReading =
          reading(upper, lower);
        if (strain !== undefined)
          return {
            overshoot,
            deviation: 0,
            ...(turn === null
              ? {}
              : { exact: (): number => turn(upper, lower, above) }),
            // A reference pose keeps its side through a stroke, so its turn
            // decides before the strain; without one the strain decides.
            tiebreak: (): number =>
              props.referencePose === undefined
                ? strain(upper, lower, lowerWorld ?? Quaternion.multiply(above!, lower))
                : anchor * (apart(upper, before[0]) + midTurn),
          };
        // The hint's side weighs as the mid joint leaves the line to the
        // target: a straight limb has no side, and a rounding-sized offset's
        // direction must not rank swivels.
        let away: number = 0;
        if (side !== null) {
          const offset: IAutoMovieVector3 = across(mid!);
          const off: number = Vector3.length(offset);
          if (!(off < 1e-12))
            away = (1 - Vector3.dot(Vector3.scale(offset, 1 / off), side)) *
              Math.min(1, off / SIDED);
        }
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
            turn(upper, lower, above) + 2 * away + turned + 1e-9 * effort,
        };
      },
    });
  if (solved === null) return null;
  const upper: IAutoMovieJointPose = upperOf(solved.upper);
  const lower: IAutoMovieJointPose = midOf(solved.lower).joint;
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

/** The hint side's full-weight distance (`hingedChainSide.SIDED`), metres. */
const SIDED: number = hingedChainSide.SIDED;

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

/** What each candidate reads besides the hint's side, shared with its lazy exact score. */
interface IReading {
  /** Completed world frame preceding the lower articulation, for this exact upper candidate. */
  above: IAutoMovieQuaternion | undefined;

  /** The mid joint's place, world metres; absent when task priority never reads it. */
  mid: IAutoMovieVector3 | undefined;

  /** The mid bone's world rotation. */
  lowerWorld: IAutoMovieQuaternion | undefined;

  /** Actual clinical effort for continuous-cost policy; unused zero in task-priority mode. */
  effort: number;

  /** The ROM overshoot of both joints plus the obstruction, degrees. */
  overshoot: number;

  /** Actual weighted reference turn for continuous-cost policy; task-priority reads it lazily. */
  turned: number;

  /** Fixed branch's lower-reference turn, for lazy task-priority comparison. */
  midTurn: number;
}
