import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieFitChainToTargetProps,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMovieJointRotationFrame,
  IAutoMoviePreparedChainPlant,
  IAutoMovieQuaternion,
  IAutoMovieResolvedJointAngles,
  IAutoMovieRestFrame,
  IAutoMovieSolvedChainPlant,
  IAutoMovieSwivelArcs,
  IAutoMovieVector3,
} from "@automovie/interface";

import { boxExcludedSwivels } from "../kinematics/internal/boxExcludedSwivels";
import { boxLeastSwivels } from "../kinematics/internal/boxLeastSwivels";
import { clinicalDeviation } from "../kinematics/internal/clinicalDeviation";
import { decomposeJointRotationOnBasis } from "../kinematics/decomposeJointRotationOnBasis";
import { distalEndSwivelAdmitted } from "../kinematics/internal/distalEndSwivelAdmitted";
import { distalEndSwivelArcs } from "../kinematics/internal/distalEndSwivelArcs";
import { distalEndSwivelMiss } from "../kinematics/internal/distalEndSwivelMiss";
import { distalEndSwivelNearest } from "../kinematics/internal/distalEndSwivelNearest";
import { distalEndSwivelReadings } from "../kinematics/distalEndSwivelReadings";
import type { distalTwistSwivelRange } from "../kinematics/distalTwistSwivelRange";
import { hingedArmArticulation } from "../kinematics/internal/hingedArmArticulation";
import { hingedArmSwivel } from "../kinematics/hingedArmSwivel";
import { hingedSwivelAhead } from "../kinematics/internal/hingedSwivelAhead";
import { hingedSwivelFeasible } from "../kinematics/internal/hingedSwivelFeasible";
import { immobileAxisSwivels } from "../kinematics/internal/immobileAxisSwivels";
import { readsSwingTwistFrame } from "../kinematics/internal/readsSwingTwistFrame";
import { swingTwistRange } from "../kinematics/swingTwistRange";
import { swivelArcs } from "../kinematics/swivelArcs";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { ROM_TOLERANCE } from "../rom/constants/ROM_TOLERANCE";
import { getConstraint } from "../rom/internal/getConstraint";
import { distalTwistRange } from "./internal/distalTwistRange";
import { fitHingedClosedRoots } from "./internal/fitHingedClosedRoots";
import { fitHingedRotationError } from "./fitHingedRotationError";
import { hingedChainSide } from "./internal/hingedChainSide";
import { hingedReferenceInterval } from "./internal/hingedReferenceInterval";
import { hingedRotationStart } from "./internal/hingedRotationStart";
import { hingedTwistStart } from "./internal/hingedTwistStart";
import { posedHingeSwing } from "./internal/posedHingeSwing";
import type { prepareChainFit } from "./internal/prepareChainFit";
import { readHingeRange } from "./internal/readHingeRange";

/**
 * The hinged chain's candidate: `hingedArmArticulation`'s swivel sweep with
 * each candidate decomposed through the prepared clinical domains, scored first
 * by the rig's ROM overshoot plus the request's `obstruction` of the
 * candidate's mid and end joints, and then by one continuous cost: the
 * requested effector rotation's error in degrees (when one is requested), plus
 * two degrees per unit of the mid joint's swing away from the bend hint's side
 * of the root-to-target axis (`1 - cos`; without a hint, the side the posed
 * hinge already bends toward, see `posedHingeSwing`), plus, when the request
 * carries a `referencePose` (a grid-free reference such as the solution at a
 * contact event, never the previous frame, so a pose stays a pure function of
 * time), the degrees the root and mid joints turn away from it, with the
 * clinical effort as a vanishing tie-break. The cost is continuous in the
 * target, so the chosen swivel moves continuously as a target moves and jumps
 * only where two separate minima tie exactly; the reference term then decides
 * the tie toward the reference's side. The weights are provisional, as no
 * source fixes them. Under this continuous cost the cold fit starts in closed
 * form: without a requested rotation at the side term's peak, the pole of
 * two-bone IK (`hingedChainSide.peak`), which alone answers when no reference
 * or obstruction is asked; with one, at the swivel needing the least end-joint
 * articulation (`hingedRotationStart`, or `hingedTwistStart` on a limb whose
 * mid segment twists distally). It searches locally and keeps a legal result
 * whose rotation is met; the full sweep runs otherwise and when the limb has no
 * side. Before either, a requested rotation on a limb without distal twist
 * whose end joint has one immobile axis (an ankle) is answered with no search:
 * such a joint takes the rotation only where the rotation demanded of it reads
 * that axis neutral, at most two swivels a bend branch in closed form
 * (`immobileAxisSwivels`), and the best of them under the same score is the fit
 * when it is legal and the rotation is met. A limb whose mid segment twists
 * distally (an arm) offers one candidate the same way: the swivel nearest the
 * hint's pole that its end joint's box (`distalEndSwivelArcs`) and its mid
 * segment's twist range (`distalTwistSwivelRange`) both admit, an interval end
 * in closed form (`distalEndSwivelNearest`); with a reference pose, the box's
 * alone, since the reference's turn then ranks beside the hint. Where that
 * candidate does not answer, the sweep is bounded from below by the least the
 * end joint must miss the rotation by at each swivel (`distalEndSwivelMiss`)
 * or, when greater, the least the mid segment's twist range must
 * (`distalTwistSwivelRange`'s miss), besides the hint's side, so a rotation no
 * swivel lets the wrist take is fitted by scoring only the swivels near the
 * least miss, with the full sweep's choice. One degree of joint turn from the
 * reference counts as much as one degree of effector error (times the request's
 * `referenceWeight`, 1 when omitted), so the reference's side is kept unless a
 * turn buys at least as much accuracy; and the hint's side is worth 2 degrees
 * per unit of `1 - cos` (4 degrees for the opposite side), enough to decide
 * between otherwise equal swivels while never outweighing a visible effector
 * error. A request continuing a nearby fit (`near`) refines that fit's seed
 * instead of sweeping, and the candidate carries the seed it was chosen at. A
 * request whose bend is the place a completed elbow search chose (`placed`)
 * searches locally from that place's pole and answers there when legal,
 * sweeping only where it is not. A request with a `strain` ranks the swivels by
 * task priority instead (Siciliano and Slotine 1991): legality, then the hand's
 * rotation error, two errors in one bucket of the joints' tolerance
 * (`ROM_TOLERANCE`) being one (a quantisation, so the ranking is transitive and
 * its choice independent of the order candidates are met in; the rotation's
 * certified miss bounds that first key, so swivels whose miss lies in a later
 * bucket are not scored), then the turn from a `referencePose` when one is
 * given (which keeps a stroke's side), else the strain, with no bend hint; the
 * candidate carries the value it was chosen by, so a caller ranking keys by
 * their fits reads one continuous value (Berge's maximum theorem) instead of a
 * measure taken at another search's argmin. Under that ranking a candidate at a
 * swivel where the closed form shows the rotation met (inside the end joint's
 * box arcs, its mid segment's twist inside its range) is ranked in the first
 * bucket without its error being measured; the chosen candidate's error is
 * measured for the value, and a choice whose measured bucket differs from the
 * one it was ranked by is searched again with every error measured. A continued
 * fit tries the closed-form candidates lying by its seed before refining it
 * (`hingedSwivelNear`), on a limb with an immobile end axis the root of that
 * axis nearest its seed, so a knee keeps the side its seed chose (Tolani,
 * Goswami and Badler 2000, section 3.2.4, the feasible swivel nearest the
 * desired one), and a cold fit whose rotation's certified miss exceeds the
 * tolerance at every swivel skips the pole start that could not be accepted. A
 * continued fit starts inside the root's feasible interval overlapping its
 * seed's (`hingedSwivelFeasible`) and the admitted arc overlapping its seed's,
 * and reports an interval's vanishing instead of jumping to another. A cold fit
 * with no obstruction whose root's box refuses every swivel (a hip whose
 * flexion the target takes past its range on the whole swivel circle) has no
 * legal candidate: its least overshoot is searched for from the swivels at
 * which each limit of the box is least violated (`boxLeastSwivels`, Tolani,
 * Goswami and Badler 2000, section 3.2.3), not by the sweep.
 *
 * @param props The fit request, with merged axes.
 * @param prepared The chain's preparation.
 * @param axes The mid bone's axes; its flexion is the hinge.
 * @param rotation A requested effector rotation, ranked before the hint's side
 *   when given.
 * @param rig The rig of the same unchanged source workspace, carrying the upper
 *   joint's prepared swing region; source-only basis, reference, hinge range
 *   and posed swing may be shared, while every candidate score and callback
 *   remains target-local.
 * @returns The candidate, or null for a degenerate chain.
 */
export function fitHingedChainCandidate(
  props: IAutoMovieFitChainToTargetProps,
  prepared: NonNullable<IAutoMoviePreparedChainPlant | null>,
  axes: IAutoMovieJointAxes,
  rotation: IAutoMovieQuaternion | undefined,
  rig: prepareChainFit.IRig,
): IAutoMovieSolvedChainPlant | null {
  const turn:
    | ((
        upper: IAutoMovieQuaternion,
        lower: IAutoMovieQuaternion,
        preparedAbove?: IAutoMovieQuaternion,
      ) => number)
    | null =
    rotation === undefined
      ? null
      : (
          upper: IAutoMovieQuaternion,
          lower: IAutoMovieQuaternion,
          preparedAbove?: IAutoMovieQuaternion,
        ): number =>
          (erring ??= fitHingedRotationError(
            props,
            prepared,
            axes,
            rotation,
            rig,
          ))(upper, lower, preparedAbove);
  // The scorer of the displayed rotation error is prepared by the first
  // candidate measured: a fit its closed roots answer measures none.
  let erring: ReturnType<typeof fitHingedRotationError> | undefined;
  // One candidate's rotation error is read by its exact score and again by
  // the acceptance of the chosen one: the same pure reading of the same
  // candidate record, so it is measured once for this solve.
  const errors: Map<IAutoMovieQuaternion, number> = new Map();
  const measure = (
    upper: IAutoMovieQuaternion,
    lower: IAutoMovieQuaternion,
    above?: IAutoMovieQuaternion,
  ): number => {
    let error: number | undefined = errors.get(upper);
    if (error === undefined) {
      error = turn!(upper, lower, above);
      errors.set(upper, error);
    }
    return error;
  };
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
      Vector3.subtract(root, posedHingeSwing(props, prepared, axes)),
  );
  const side: IAutoMovieVector3 | null =
    Vector3.length(hint) < 1e-9 ? null : Vector3.normalize(hint);

  // The mid joint's offset across the root-to-target axis at a swivel of a
  // branch whose root rotation `upper` gives, read by the side bound and pole.
  const offsetOf =
    (
      upper: (swivel: number) => IAutoMovieQuaternion,
    ): ((swivel: number) => IAutoMovieVector3) =>
    (swivel: number): IAutoMovieVector3 =>
      across(
        Vector3.add(
          root,
          Quaternion.rotateVector(
            Quaternion.multiply(prepared.upper.worldRotation, upper(swivel)),
            prepared.lowerOffset,
          ),
        ),
      );
  // Each basis is admitted and normalized once for the whole sweep; the
  // candidates differ only in their rotation.
  const upperBasis: IAutoMovieJointAxes = rig.basis(
    props.chain.upper,
    "decomposeJointRotation axes",
  );
  const lowerBasis: IAutoMovieJointAxes = rig.basis(
    props.chain.lower,
    "decomposeJointRotation axes",
  );
  // The overshoot the decomposition's chart choice scored for the angles it
  // returned (`decomposeJointRotationOnBasis.scored`), the root's gate sum
  // where its constraint is ungated.
  const scoredUpper: decomposeJointRotationOnBasis.IScore = {
    overshoot: undefined,
  };
  const upperOf = (upper: IAutoMovieQuaternion): IAutoMovieJointPose => {
    const read: IAutoMovieResolvedJointAngles =
      decomposeJointRotationOnBasis.scored(
        upper,
        upperBasis,
        props.restFrames?.[props.chain.upper],
        prepared.upperDomain,
        scoredUpper,
      );
    return {
      bone: props.chain.upper,
      flexion: read.flexion,
      abduction: read.abduction,
      twist: read.twist,
    };
  };
  const before: [IAutoMovieQuaternion | null, IAutoMovieQuaternion | null] = [
    rig.reference(props.chain.upper),
    rig.reference(props.chain.lower),
  ];
  const anchor: number = rig.referenceWeight();
  const apart = (
    a: IAutoMovieQuaternion,
    b: IAutoMovieQuaternion | null,
  ): number =>
    b === null ? 0 : (Quaternion.angleAfterNormalize(a, b) * 180) / Math.PI;

  // The gate's axes, clinical frame and constraint are fixed for every swivel
  // here.
  const upperOvershoot: (
    joint: IAutoMovieJointPose,
    rotation?: IAutoMovieQuaternion,
  ) => number = rig.overshoot(props.chain.upper);

  // A root gated by swing and twist reads its range on the candidate's own
  // rotation where the angles are decomposed on the range's own basis and
  // rest frame (`readsSwingTwistFrame`), so the scan composes nothing back.
  const upperConstraint: IAutoMovieJointConstraint | null =
    prepared.upperDomain.constraint;
  const upperRange: IAutoMovieJointRotationFrame | undefined =
    upperConstraint === null ||
    upperConstraint.swingTwist === undefined ||
    upperConstraint.swingTwist === null
      ? undefined
      : swingTwistRange.of(props.chain.upper);
  const upperPrepared: IAutoMovieJointRotationFrame | undefined =
    rig.upperRange;
  const upperRotated: boolean =
    upperRange !== undefined &&
    readsSwingTwistFrame(
      upperBasis,
      props.restFrames?.[props.chain.upper],
      upperRange,
    );
  // Such a root's range reads its rotation alone, so under task priority,
  // which weighs no clinical effort, its angles are needed by the answer
  // alone: a candidate's are not decomposed, the chosen one's are where its
  // record is made. The continuous cost's effort tie-break reads them for
  // every candidate: near an optimum the refinement's neighbours differ by
  // less than a billionth of the most two joints' efforts can be, so no
  // certified band leaves them unread.
  const rotatedOvershoot: ((rotation: IAutoMovieQuaternion) => number) | null =
    !upperRotated || props.strain === undefined
      ? null
      : rig.rotatedOvershoot(props.chain.upper);
  const lowerOvershoot: (joint: IAutoMovieJointPose) => number = rig.overshoot(
    props.chain.lower,
  );
  // A sweep's candidates on one bend branch share one mid rotation, the
  // same record, and differ only in the swivel of the root. What depends on
  // the mid rotation alone is read once per record: the same values, read
  // once instead of per candidate.
  let mid: IMid | undefined;
  const midOf = (lower: IAutoMovieQuaternion): IMid => {
    if (mid !== undefined && mid.rotation === lower) return mid;
    const read: IAutoMovieResolvedJointAngles = decomposeJointRotationOnBasis(
      lower,
      lowerBasis,
      props.restFrames?.[props.chain.lower],
      prepared.lowerDomain,
    );
    const joint: IAutoMovieJointPose = {
      bone: props.chain.lower,
      flexion: read.flexion,
      abduction: read.abduction,
      twist: read.twist,
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
  const range: { min: number; max: number } | null = rig.hingeRange(
    (): { min: number; max: number } | null =>
      readHingeRange(props, prepared, axes, lowerBasis),
  );
  // The root angles of the last two candidates decomposed, kept for the
  // answer.
  // answer, each with the overshoot its chart choice scored.
  let latest: IAngles | undefined;
  let earlier: IAngles | undefined;
  const decomposed = (upper: IAutoMovieQuaternion): IAngles => {
    if (latest?.rotation === upper) return latest;
    if (earlier?.rotation === upper) return earlier;
    const joint: IAutoMovieJointPose = upperOf(upper);
    earlier = latest;
    latest = { rotation: upper, joint, overshoot: scoredUpper.overshoot };
    return latest;
  };
  const anglesOf = (upper: IAutoMovieQuaternion): IAutoMovieJointPose =>
    decomposed(upper).joint;
  // The chart choice scores an ungated root by the gate's own sum on the
  // same constraint the root's scorer reads, so that sum is its overshoot.
  const scoredByChart: boolean =
    !upperRotated &&
    rig.domain(props.chain.upper).constraint ===
      prepared.upperDomain.constraint;

  // What a candidate reads besides the hint's side: its root's angles, its
  // mid joint's place, its overshoot, effort and turn from the reference.
  // A root whose range reads its rotation leaves its angles unread unless
  // the caller needs them at once (`full`); a rotation with a non-finite
  // component is decomposed, which refuses it.
  function reading(
    upper: IAutoMovieQuaternion,
    lower: IAutoMovieQuaternion,
    full: boolean,
  ): IReading;
  function reading(
    upper: IAutoMovieQuaternion,
    lower: IAutoMovieQuaternion,
    full: boolean,
    legalOnly: boolean,
  ): IReading | null;
  function reading(
    upper: IAutoMovieQuaternion,
    lower: IAutoMovieQuaternion,
    full: boolean,
    legalOnly: boolean = false,
  ): IReading | null {
    const angles: IAngles | undefined =
      rotatedOvershoot !== null && !full ? undefined : decomposed(upper);
    const u: IAutoMovieJointPose | undefined = angles?.joint;
    const known: IMid = midOf(lower);

    const jointOvershoot = (): number =>
      (u === undefined
        ? rotatedOvershoot!(upper)
        : scoredByChart && angles!.overshoot !== undefined
          ? angles!.overshoot
          : upperOvershoot(u, upperRotated ? upper : undefined)) +
      known.overshoot;
    const admitted: number | undefined =
      legalOnly && props.obstruction === undefined
        ? jointOvershoot()
        : undefined;
    if (admitted !== undefined && admitted !== 0) return null;

    // Task priority reads no hint midpoint. A reference also replaces its
    // strain callback, leaving world frames only to rotation or obstruction.
    const needsMid: boolean =
      props.obstruction !== undefined ||
      (strain === undefined && side !== null);
    const needsAbove: boolean =
      props.obstruction !== undefined ||
      turn !== null ||
      (strain !== undefined && props.referencePose === undefined);
    const turnedUpper: IAutoMovieQuaternion | undefined =
      needsMid || needsAbove
        ? Quaternion.multiply(prepared.upper.worldRotation, upper)
        : undefined;
    const above: IAutoMovieQuaternion | undefined = needsAbove
      ? Quaternion.multiply(turnedUpper!, prepared.lowerRotation)
      : undefined;
    const lowerWorld: IAutoMovieQuaternion | undefined =
      props.obstruction === undefined
        ? undefined
        : Quaternion.multiply(above!, lower);
    const mid: IAutoMovieVector3 | undefined = needsMid
      ? Vector3.add(
          root,
          Quaternion.rotateVector(turnedUpper!, prepared.lowerOffset),
        )
      : undefined;
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
    // Angles are left unread only under task priority, whose effort is 0;
    // the effort is `clinicalDeviation`'s sum, read off the record.
    let effort: number = 0;
    if (strain === undefined) {
      const f: number = u!.flexion ?? 0;
      const a: number = u!.abduction ?? 0;
      const t: number = u!.twist ?? 0;
      effort = f * f + a * a + t * t + known.effort;
    }
    // A fresh record, which its readers take apart at once: one the
    // compiler can keep in registers, where a shared record refilled each
    // candidate cost the fits of the punch and rod scenes time.
    return {
      joint: u,
      mid,
      above,
      lowerWorld,
      effort,
      overshoot: (admitted ?? jointOvershoot()) + blocked,
      turned:
        strain === undefined
          ? anchor * (apart(upper, before[0]) + known.turned)
          : 0,
      midTurn: known.turned,
    };
  }
  // With a strain the swivels are ranked by task priority (Siciliano and
  // Slotine 1991): legality, then the hand's rotation error, errors in one
  // bucket of the joints' tolerance (`ROM_TOLERANCE`) being one, then the strain; the
  // bend hint's side plays no part.
  const strain:
    | ((
        upper: IAutoMovieQuaternion,
        lower: IAutoMovieQuaternion,
        lowerWorld: IAutoMovieQuaternion,
      ) => number)
    | undefined = props.strain;
  // Where the mid segment points in the requested rotation's frame at a
  // swivel of a branch (`distalEndSwivelReadings`), read by the closed-form
  // candidate and by the sweep's bound alike.
  const along: IAutoMovieVector3 | null = ((): IAutoMovieVector3 | null => {
    const length: number = Vector3.length(prepared.effectorOffset);
    return length > 1e-12
      ? Vector3.scale(prepared.effectorOffset, 1 / length)
      : null;
  })();
  const pointing = (
    posed: ReturnType<typeof hingedArmSwivel.pose>,
  ): distalEndSwivelReadings.IProps => {
    const end: IEnd = (ended ??= endOf(props, rig));
    const back: IAutoMovieQuaternion = Quaternion.inverse(
      Quaternion.normalize(rotation!),
    );
    return {
      basis: end.basis,
      frame: end.frame,
      constraint: end.constraint,
      axis: Quaternion.rotateVector(end.restInverse, along!),
      direction: (swivel: number): IAutoMovieVector3 => {
        const at: ReturnType<ReturnType<typeof hingedArmSwivel.pose>> =
          posed(swivel);
        return Quaternion.rotateVector(
          back,
          Quaternion.rotateVector(
            Quaternion.multiply(
              Quaternion.multiply(
                Quaternion.multiply(prepared.upper.worldRotation, at.upper),
                prepared.lowerRotation,
              ),
              at.lower,
            ),
            along!,
          ),
        );
      },
    };
  };
  // Whether the hand's rotation error has a closed-form lower bound: a
  // requested rotation on a limb whose mid segment twists distally about
  // the line to its end, so that no twist moves where the segment points
  // (the bound's premise; a twist axis off that line by an angle would move
  // the direction by up to twice it).
  const missed: boolean =
    turn !== null &&
    rotation !== undefined &&
    along !== null &&
    lowerBasis.twistPlacement === "distal" &&
    Math.abs(Vector3.dot(Vector3.normalize(lowerBasis.twist), along)) >
      1 - 1e-9;
  let ended: IEnd | undefined;
  // The arc the chosen swivel's requested rotation is admitted in, and
  // whether the arc a continued seed was admitted in vanished
  // (`IAutoMovieSwivelSeed`), read once for the answer.
  let admittedArc: IAutoMovieSwivelArcs.IArc | null = null;
  let feasibleArc: IAutoMovieSwivelArcs.IArc | null = null;
  let vanished: boolean = false;

  // The swivels of a branch at which the requested rotation reads the end
  // joint's immobile axis neutral (`immobileAxisSwivels`): the closed-form
  // candidates of a cold fit and the start of a continued one.
  const immobileRoots = (
    posed: ReturnType<typeof hingedArmSwivel.pose>,
  ): number[] | null => {
    const end: IEnd = (ended ??= endOf(props, rig));
    return immobileAxisSwivels({
      basis: end.basis,
      frame: end.frame,
      constraint: end.constraint,
      rotation: (swivel: number): IAutoMovieQuaternion => {
        const at: ReturnType<ReturnType<typeof hingedArmSwivel.pose>> =
          posed(swivel);
        return Quaternion.normalize(
          Quaternion.multiply(
            end.restInverse,
            Quaternion.multiply(
              Quaternion.inverse(
                Quaternion.multiply(
                  Quaternion.multiply(
                    Quaternion.multiply(prepared.upper.worldRotation, at.upper),
                    prepared.lowerRotation,
                  ),
                  at.lower,
                ),
              ),
              rotation!,
            ),
          ),
        );
      },
    });
  };

  // A branch's arcs of swivels the end joint's box refuses, kept `INSIDE`
  // the box (`distalEndSwivelArcs`): read once a branch by the closed-form
  // candidate, the continued fit's start and the shown test alike. Null
  // where the mid segment has no direction.
  const arced: Map<
    object,
    { arcs: ReturnType<typeof distalEndSwivelArcs> }
  > = new Map();
  const arcsOf = (
    posed: ReturnType<typeof hingedArmSwivel.pose>,
  ): ReturnType<typeof distalEndSwivelArcs> => {
    if (along === null) return null;
    let known: { arcs: ReturnType<typeof distalEndSwivelArcs> } | undefined =
      arced.get(posed);
    if (known === undefined) {
      known = {
        arcs: distalEndSwivelArcs({ ...pointing(posed), margin: -INSIDE }),
      };
      arced.set(posed, known);
    }
    return known.arcs;
  };

  // A branch's twist-range reading (`distalTwistRange`), read once a branch
  // by the closed-form candidate and by the sweep's bound alike.
  const twists: Map<
    object,
    { range: distalTwistSwivelRange.IRange | null }
  > = new Map();
  const twisting = (
    posed: ReturnType<typeof hingedArmSwivel.pose>,
  ): distalTwistSwivelRange.IRange | null => {
    let known: { range: distalTwistSwivelRange.IRange | null } | undefined =
      twists.get(posed);
    if (known === undefined) {
      const end: IEnd = (ended ??= endOf(props, rig));
      known = {
        range: distalTwistRange({
          prepared,
          axis: lowerBasis.twist,
          frame: props.restFrames?.[props.chain.lower]?.twist,
          flexion: end.basis.flexion,
          fixed: rig.distalTwist(),
          posed,
          rotation: rotation!,
        }),
      };
      twists.set(posed, known);
    }
    return known.range;
  };

  // The twist range's own lower bound of the rotation's miss on a branch;
  // null when either joint's analysis does not apply. Read only where
  // `missed` holds, so the mid segment's twist axis lies along it.
  const twistMiss = (
    posed: ReturnType<typeof hingedArmSwivel.pose>,
  ): ((low: number, high: number) => number) | null => {
    const range: distalTwistSwivelRange.IRange | null = twisting(posed);
    if (range === null) return null;
    const read: distalEndSwivelReadings.IReadings | null =
      distalEndSwivelReadings.of(pointing(posed));
    if (read === null) return null;
    // The rectangle's sense: the end joint's rest carries its twist axis
    // onto the mid segment's direction or its opposite (`read.sense`), and
    // the mid segment's own twist axis runs along that direction or
    // against it.
    const forward: 1 | -1 = Vector3.dot(lowerBasis.twist, along!) > 0 ? 1 : -1;
    return range.miss(
      read.abduction ?? [-90, 90],
      read.sense === forward ? 1 : -1,
    );
  };

  // A branch's certified lower bound of the rotation's miss, read once a
  // branch by the sweep's bound and by the pole start's certificate alike.
  // The miss is bounded twice, by what the end joint's box cannot take of
  // where the mid segment points (`distalEndSwivelMiss`) and by what the mid
  // segment's twist range cannot take of the twist left to it
  // (`distalTwistSwivelRange`'s miss): a rotation no swivel meets fails one
  // or the other at every swivel, and the greater of two lower bounds is one.
  const misses: Map<
    object,
    { miss: ((low: number, high: number) => number) | null }
  > = new Map();
  const missOf = (
    posed: ReturnType<typeof hingedArmSwivel.pose>,
  ): ((low: number, high: number) => number) | null => {
    let known:
      | { miss: ((low: number, high: number) => number) | null }
      | undefined = misses.get(posed);
    if (known === undefined) {
      const boxed: ((low: number, high: number) => number) | null =
        distalEndSwivelMiss(pointing(posed));
      const twisted: ((low: number, high: number) => number) | null =
        boxed === null ? null : twistMiss(posed);
      known = {
        miss:
          boxed === null || twisted === null
            ? boxed
            : (low: number, high: number): number =>
                Math.max(boxed(low, high), twisted(low, high)),
      };
      misses.set(posed, known);
    }
    return known.miss;
  };

  // Whether the two end joints show the requested rotation at a swivel of a
  // branch, in closed form: the swivel lies outside every arc the end joint's
  // box refuses, with `INSIDE` to spare (`distalEndSwivelArcs`), and the twist
  // the rotation leaves the mid segment exists and lies inside its range
  // (`distalTwistSwivelRange.admits`). That twist is then one of the roots
  // `solveDistalTwist` reads among its candidates, and the end joint's
  // demand at it lies inside its box, which its projection returns as it is:
  // the measured error is rounding, in the first bucket of any tolerance.
  // Null where either analysis does not apply; read once a branch.
  const shows: Map<object, { test: ((swivel: number) => boolean) | null }> =
    new Map();
  const shown = (
    posed: ReturnType<typeof hingedArmSwivel.pose>,
    swivel: number,
  ): boolean => {
    let known: { test: ((swivel: number) => boolean) | null } | undefined =
      shows.get(posed);
    if (known === undefined) {
      const arcs: ReturnType<typeof distalEndSwivelArcs> = arcsOf(posed);
      const twist: distalTwistSwivelRange.IRange | null =
        arcs === null || arcs === "all" ? null : twisting(posed);
      known = {
        test:
          arcs === null || arcs === "all" || twist === null
            ? null
            : (at: number): boolean => {
                const turned: number = at - 360 * Math.floor(at / 360);
                return (
                  !arcs.some(
                    (arc: { from: number; to: number }): boolean =>
                      arc.from <= turned && turned <= arc.to,
                  ) && twist.admits(at)
                );
              },
      };
      shows.set(posed, known);
    }
    return known.test !== null && known.test(swivel);
  };

  // Under task priority with a requested rotation, the first key is the
  // bucket of the rotation's error, so a candidate the closed form shows to
  // meet the rotation needs no measured error to be ranked: its bucket is
  // the first. The chosen candidate's error is measured below, and a choice
  // whose measured bucket is not the one it was ranked by is searched again
  // with every error measured.
  const anchored: boolean =
    strain === undefined &&
    anchor > 0 &&
    (before[0] !== null || before[1] !== null);
  const certifying: boolean = strain !== undefined && turn !== null && missed;
  // The root's feasible swivels on a branch (`hingedSwivelFeasible`): the
  // intervals its limits leave, in closed form, the frame its overshoot
  // reads it in without a rig.
  const feasibleOf = (
    posed: ReturnType<typeof hingedArmSwivel.pose>,
  ): IAutoMovieSwivelArcs.IArc[] | "all" =>
    hingedSwivelFeasible({
      basis: upperBasis,
      frame: props.restFrames?.[props.chain.upper],
      constraint: prepared.upperDomain.constraint,
      joint: upperPrepared ?? swingTwistRange.of(props.chain.upper),
      rotation: (swivel: number): IAutoMovieQuaternion => posed(swivel).upper,
    });

  // A continued seed kept inside the root's limits (Tolani, Goswami and
  // Badler 2000, section 3.2.3): the seed itself where a feasible interval
  // holds it, else the nearer end of the feasible interval overlapping the
  // seed's own (`IAutoMovieSwivelSeed.feasible`), the same connected
  // interval moved by the target. Where none overlaps it, the interval
  // vanished: null, reported (`IAutoMovieSwivelSeed.vanished`). A seed with
  // no interval of its own stays where it is.
  const feasibleStart = (
    posed: ReturnType<typeof hingedArmSwivel.pose>,
    swivel: number,
  ): number | null => {
    const held: IAutoMovieSwivelArcs.IArc | undefined = props.near?.feasible;
    if (held === undefined) return swivel;
    const arcs: IAutoMovieSwivelArcs.IArc[] | "all" = feasibleOf(posed);
    if (arcs === "all" || swivelArcs.holding(arcs, swivel) !== null)
      return swivel;
    const next: IAutoMovieSwivelArcs.IArc | undefined = arcs.find(
      (arc: IAutoMovieSwivelArcs.IArc): boolean => overlapping(arc, held),
    );
    if (next === undefined) {
      vanished = true;
      return null;
    }
    const shift: number =
      360 * Math.round(((next.from + next.to) / 2 - swivel) / 360);
    const from: number = next.from - shift;
    const to: number = next.to - shift;
    return Math.abs(from - swivel) <= Math.abs(to - swivel) ? from : to;
  };

  // A requested rotation on a limb whose mid segment twists distally is
  // continued in the arc of swivels its seed was admitted in, where the end
  // joint's box and the mid segment's twist range both admit the rotation
  // (Tolani, Goswami and Badler 2000, section 3.2.4): the start itself while
  // the arc still holds it, else the admitted swivel nearest it
  // (`distalEndSwivelNearest`) only where that swivel's arc overlaps the
  // seed's. Where none does, the arc vanished: null, reported. A seed
  // admitted in no arc follows an admitted swivel only within the
  // refinement's own step.
  const admittedStart = (
    posed: ReturnType<typeof hingedArmSwivel.pose>,
    swivel: number,
  ): number | null => {
    const arcs: ReturnType<typeof distalEndSwivelArcs> = arcsOf(posed);
    if (arcs === null) return swivel;
    const range: distalTwistSwivelRange.IRange | null = twisting(posed);
    const start: number | null = distalEndSwivelNearest(arcs, range, swivel);
    if (start === null || start === swivel) return swivel;
    const held: IAutoMovieSwivelArcs.IArc | undefined = props.near?.admitted;
    if (held === undefined) {
      const turn: number = start - swivel;
      return Math.abs(turn - 360 * Math.round(turn / 360)) <=
        hingedArmSwivel.STEP
        ? start
        : swivel;
    }
    const around: IAutoMovieSwivelArcs.IArc | null = distalEndSwivelAdmitted(
      arcs,
      range,
      start,
    );
    if (around !== null && overlapping(around, held)) return start;
    vanished = true;
    return null;
  };

  // On a limb whose mid segment takes no distal twist and whose end joint
  // has an immobile axis (an ankle), the requested rotation holds only at
  // that axis's roots, at most two swivels a branch in closed form
  // (`immobileAxisSwivels`, Tolani, Goswami and Badler 2000, section
  // 3.2.3: an end-joint limit is a sinusoid of the swivel): the root nearest
  // the start, so a knee keeps the side the seed chose.
  const rootStart = (
    posed: ReturnType<typeof hingedArmSwivel.pose>,
    swivel: number,
  ): number => {
    const roots: number[] | null = immobileRoots(posed);
    if (roots === null || roots.length === 0) return swivel;
    let best: number = swivel;
    let apart: number = Infinity;
    for (const root of roots) {
      const turn: number = root - swivel;
      const distance: number = Math.abs(turn - 360 * Math.round(turn / 360));
      if (distance < apart) {
        apart = distance;
        best = root;
      }
    }
    return best;
  };

  // A continued fit's start: the seed kept inside the root's feasible
  // interval, then inside the arc its requested rotation is admitted in or
  // at the immobile axis's root nearest it; a start the rotation moves out of
  // the feasible interval keeps the feasible one, which the ranking puts
  // first. Null where an interval vanished, the seed then refined alone.
  const continuedStart = (
    posed: ReturnType<typeof hingedArmSwivel.pose>,
    swivel: number,
  ): number | null => {
    const feasible: number | null = feasibleStart(posed, swivel);
    if (feasible === null) return null;
    const turned: number | null =
      rotation === undefined
        ? feasible
        : lowerBasis.twistPlacement === "distal"
          ? admittedStart(posed, feasible)
          : strain === undefined
            ? rootStart(posed, feasible)
            : feasible;
    if (turned === null) return null;
    if (turned === feasible || props.near?.feasible === undefined)
      return turned;
    const arcs: IAutoMovieSwivelArcs.IArc[] | "all" = feasibleOf(posed);
    return arcs === "all" || swivelArcs.holding(arcs, turned) !== null
      ? turned
      : feasible;
  };

  const search = (
    trusting: boolean,
  ): ReturnType<typeof hingedArmArticulation> =>
    hingedArmArticulation({
      upper: prepared.upper,
      midOffset: prepared.lowerOffset,
      midRest: prepared.lowerRotation,
      endOffset: prepared.effectorOffset,
      hinge: axes.flexion,
      target: props.target,
      ...(range === null ? {} : { range }),
      prepared: rig.hingedGeometry()?.target(props.target, range ?? undefined),
      // A fit of a nearby target continued from its seed refines that seed
      // alone (`IAutoMovieSwivelNear`).
      ...(props.near === undefined ? {} : { near: props.near }),
      // A swept fit's seed only starts the bounded sweep's stop
      // (`IAutoMovieFitChainToTargetProps.incumbent`).
      ...(props.near !== undefined || props.incumbent === undefined
        ? {}
        : { incumbent: props.incumbent }),
      // A continued fit starts from its seed continued along time
      // (`continuedStart`): kept inside the root's feasible interval and the
      // arc the requested rotation is admitted in, never jumping to another.
      ...(props.near === undefined ? {} : { nearest: continuedStart }),
      ...(strain === undefined ? {} : { tie: ROM_TOLERANCE }),
      // With no hint side, reference or obstruction, every actual term is
      // non-negative in the original arithmetic: ROM excess, rotation angle
      // and squared clinical effort. An exact-zero original first candidate
      // cannot be improved, including by the later local refinements.
      ...(strain === undefined &&
      props.obstruction === undefined &&
      props.referencePose === undefined &&
      side === null
        ? { minimum: { overshoot: 0, deviation: 0 } }
        : {}),
      // The root's box, or its swing-twist range, refuses swivels its
      // overshoot can only score above zero, so the sweep spares them
      // (`boxExcludedSwivels`). The range is read in the frame
      // `jointRomOvershoot` reads it in without a rig.
      // Under the continuous cost every term of the deviation is
      // non-negative, so twice the hint-side term is a lower bound of it; the
      // mid joint circles the root-to-target axis as the swivel turns, so
      // that term is a sinusoid of the swivel, bounded over an interval in
      // closed form (`hingedChainSide.bound`), and the sweep scores only the swivels the
      // bound leaves open (`hingedSwivelBounded`). A requested rotation on a
      // limb whose mid segment twists distally adds the least the end joint
      // must miss it by (`distalEndSwivelMiss`): where no swivel lets the
      // wrist take the rotation, the fit is a minimisation of that miss, and
      // the bound leaves only the swivels near its minimum to score. Under
      // task priority (a strain) the first key is that rotation error alone,
      // so the miss alone bounds it and the hint's side plays no part: the
      // swivels whose miss lies in a later bucket of the tie than a legal
      // candidate's error are never scored, and the strain is read only
      // among the rest.
      ...((strain === undefined && side !== null) || missed || anchored
        ? {
            bound: (
              upper: (swivel: number) => IAutoMovieQuaternion,
              posed: ReturnType<typeof hingedArmSwivel.pose>,
            ): ((low: number, high: number) => number) => {
              const sided: ((low: number, high: number) => number) | null =
                side === null || strain !== undefined
                  ? null
                  : hingedChainSide.bound(offsetOf(upper), side);
              const miss: ((low: number, high: number) => number) | null =
                missed ? missOf(posed) : null;
              const geometric: (low: number, high: number) => number =
                sided === null
                  ? (miss ?? ((): number => 0))
                  : miss === null
                    ? sided
                    : (low: number, high: number): number =>
                        sided(low, high) + miss(low, high);
              if (!anchored) return geometric;
              const lower: number =
                before[1] === null ? 0 : apart(posed(0).lower, before[1]);
              return hingedReferenceInterval(
                geometric,
                upper,
                before[0],
                lower,
                anchor,
              );
            },
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
      // A bend that is the place a completed elbow search chose
      // (`IAutoMovieFitChainToTargetProps.placed`) starts the local search at
      // its pole and is answered there when legal, whether or not the
      // rotation is met: the place was searched once, by that search. Where
      // it is not legal, the legal swivel nearest it answers, and a continued
      // fit follows it from its seed (`AutoMovieEngineKinematicsTypes.HingedArmArticulation.IProps.placed`).
      ...(strain !== undefined
        ? {}
        : props.placed === true && side !== null
          ? {
              pole: (
                posed: ReturnType<typeof hingedArmSwivel.pose>,
              ): number | null =>
                hingedChainSide.peak(
                  offsetOf(
                    (swivel: number): IAutoMovieQuaternion =>
                      posed(swivel).upper,
                  ),
                  side,
                ),
              placed: true,
            }
          : turn === null
            ? side === null
              ? {}
              : {
                  pole: (
                    posed: ReturnType<typeof hingedArmSwivel.pose>,
                  ): number | null =>
                    hingedChainSide.peak(
                      offsetOf(
                        (swivel: number): IAutoMovieQuaternion =>
                          posed(swivel).upper,
                      ),
                      side,
                    ),
                  ...(props.referencePose === undefined &&
                  props.obstruction === undefined
                    ? { direct: true }
                    : {}),
                }
            : rotation === undefined
              ? {}
              : {
                  // A mid segment that twists distally (a forearm) turns about
                  // its own axis for free, so its start leaves the end joint
                  // the least swing (`hingedTwistStart`).
                  pole: (
                    posed: ReturnType<typeof hingedArmSwivel.pose>,
                  ): number | null =>
                    lowerBasis.twistPlacement === "distal"
                      ? hingedTwistStart(prepared, posed, rotation!)
                      : hingedRotationStart(prepared, posed, rotation!),
                  met: (
                    upper: IAutoMovieQuaternion,
                    lower: IAutoMovieQuaternion,
                  ): boolean => measure(upper, lower) <= ROM_TOLERANCE,
                  // Where the rotation's certified miss exceeds the joints'
                  // tolerance over every step of a branch's turn, no swivel of
                  // the branch is met: the measured error is never below that
                  // miss, so the pole start, accepted only when met, is not run.
                  ...(missed
                    ? {
                        unmet: (
                          posed: ReturnType<typeof hingedArmSwivel.pose>,
                        ): boolean => {
                          const miss:
                            | ((low: number, high: number) => number)
                            | null = missOf(posed);
                          if (miss === null) return false;
                          for (
                            let low: number = 0;
                            low < 360;
                            low += hingedArmSwivel.STEP
                          )
                            if (
                              !(
                                miss(low, low + hingedArmSwivel.STEP) >
                                ROM_TOLERANCE
                              )
                            )
                              return false;
                          return true;
                        },
                      }
                    : {}),
                  // An end joint with one immobile axis (an ankle) takes the
                  // rotation only where the rotation demanded of it reads that
                  // axis neutral: at most two swivels a branch, in closed form
                  // (`immobileAxisSwivels`). A distal twist carries part of
                  // the demand in the mid segment instead, so it keeps the
                  // search.
                  ...(lowerBasis.twistPlacement === "distal"
                    ? {
                        // A distal twist carries the hand's turn about the
                        // forearm, so the wrist's two angles are read off
                        // where the forearm points and each bound of its box
                        // is an arc of swivels (`distalEndSwivelArcs`): the
                        // candidate is the swivel inside the box nearest the
                        // hint's pole, or the least-swing start without a hint.
                        closed: (
                          posed: ReturnType<typeof hingedArmSwivel.pose>,
                        ): number[] | null => {
                          const arcs: ReturnType<typeof distalEndSwivelArcs> =
                            arcsOf(posed);
                          if (arcs === null) return null;
                          const desired: number | null =
                            (side === null
                              ? null
                              : hingedChainSide.peak(
                                  offsetOf(
                                    (swivel: number): IAutoMovieQuaternion =>
                                      posed(swivel).upper,
                                  ),
                                  side,
                                )) ??
                            hingedTwistStart(prepared, posed, rotation!);
                          if (desired === null) return null;

                          // The forearm's own twist range admits an interval
                          // of swivels too (`distalTwistSwivelRange`): the
                          // candidate is the swivel nearest the desired one
                          // that both the box and that range admit. A reference
                          // pose weighs a degree of turn from it like a degree
                          // of error, so the admissible swivel nearest the pole
                          // is not its ranking's choice: such a fit keeps the
                          // box's own candidate and the search behind it.
                          const nearest: number | null = distalEndSwivelNearest(
                            arcs,
                            props.referencePose !== undefined
                              ? null
                              : twisting(posed),
                            desired,
                          );
                          return nearest === null ? null : [nearest];
                        },
                      }
                    : {
                        closed: immobileRoots,
                      }),
                }),
      // The arc the chosen swivel's requested rotation is admitted in, which
      // the seed carries for the fit continuing it.
      chosen: (
        posed: ReturnType<typeof hingedArmSwivel.pose>,
        swivel: number,
      ): void => {
        const feasible: IAutoMovieSwivelArcs.IArc[] | "all" = feasibleOf(posed);
        feasibleArc =
          feasible === "all" ? null : swivelArcs.holding(feasible, swivel);
        if (rotation === undefined || lowerBasis.twistPlacement !== "distal")
          return;
        // The answer is refined to the swivel's resolution, so it keeps the
        // admitted arc it lies within that of (`distalEndSwivelAdmitted`).
        const arcs: ReturnType<typeof distalEndSwivelArcs> = arcsOf(posed);
        admittedArc =
          arcs === null
            ? null
            : distalEndSwivelAdmitted(
                arcs,
                twisting(posed),
                swivel,
                hingedArmSwivel.RESOLUTION,
              );
      },
      excluded: (
        upper: (swivel: number) => IAutoMovieQuaternion,
      ): ((low: number, high: number) => boolean) =>
        boxExcludedSwivels({
          basis: upperBasis,
          frame: props.restFrames?.[props.chain.upper],
          constraint: prepared.upperDomain.constraint,
          joint: upperPrepared ?? swingTwistRange.of(props.chain.upper),
          rotation: upper,
        }),
      // Where that refusal covers every swivel no candidate is legal, and the
      // least overshoot starts from the swivels at which each limit of the
      // root's box is least violated (`boxLeastSwivels`). An obstruction adds
      // a term those limits do not bound, so such a fit keeps the sweep.
      ...(props.obstruction === undefined
        ? {
            least: (
              upper: (swivel: number) => IAutoMovieQuaternion,
            ): number[] | null =>
              boxLeastSwivels({
                basis: upperBasis,
                frame: props.restFrames?.[props.chain.upper],
                constraint: prepared.upperDomain.constraint,
                rotation: upper,
              }),
          }
        : {}),
      score: (
        upper: IAutoMovieQuaternion,
        lower: IAutoMovieQuaternion,
        swivel: number,
        posed: ReturnType<typeof hingedArmSwivel.pose>,
      ): {
        overshoot: number;
        deviation: number;
        exact?: () => number;
        tiebreak?: () => number;
      } => {
        const {
          mid,
          above,
          lowerWorld,
          effort,
          overshoot,
          turned,
          midTurn,
        }: IReading = reading(upper, lower, false);
        if (strain !== undefined)
          return {
            overshoot,
            deviation: 0,
            ...(turn === null
              ? {}
              : {
                  exact: (): number =>
                    trusting && shown(posed, swivel)
                      ? 0
                      : measure(upper, lower, above),
                }),
            // A reference pose keeps its side through a stroke, so its turn
            // decides before the strain; without one the strain decides.
            tiebreak: (): number =>
              props.referencePose === undefined
                ? strain(
                    upper,
                    lower,
                    lowerWorld ?? Quaternion.multiply(above!, lower),
                  )
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
            away =
              (1 - Vector3.dot(Vector3.scale(offset, 1 / off), side)) *
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
            measure(upper, lower, above) + 2 * away + turned + 1e-9 * effort,
        };
      },
    });

  // A requested rotation on a limb without distal twist, with a hint side:
  // the closed roots of its end joint answer in one pass wherever their order
  // is certain (`fitHingedClosedRoots`); the search below answers the rest.
  if (
    rotation !== undefined &&
    strain === undefined &&
    side !== null &&
    lowerBasis.twistPlacement !== "distal"
  ) {
    const geometry: hingedArmSwivel.IPreparedTarget | undefined = rig
      .hingedGeometry()
      ?.target(props.target, range ?? undefined);
    const rooted: fitHingedClosedRoots.ISolved | null =
      geometry === undefined
        ? null
        : fitHingedClosedRoots({
            prepared,
            geometry,
            near: props.near,
            rotation,
            end: (ended ??= endOf(props, rig)),
            score: (
              upper: IAutoMovieQuaternion,
              lower: IAutoMovieQuaternion,
            ): fitHingedClosedRoots.IScore | null => {
              const read: IReading | null = reading(upper, lower, true, true);
              if (read === null) return null;
              const offset: IAutoMovieVector3 = across(read.mid!);
              const off: number = Vector3.length(offset);
              const away: number =
                off < 1e-12
                  ? 0
                  : (1 - Vector3.dot(Vector3.scale(offset, 1 / off), side)) *
                    Math.min(1, off / SIDED);
              return {
                joint: read.joint!,
                above: read.above!,
                overshoot: read.overshoot,
                deviation: 0 + 2 * away + read.turned + 1e-9 * read.effort,
              };
            },
            error: measure,
          });
    if (rooted !== null)
      return {
        hinge: prepared.hinge,
        upper: rooted.joint,
        lower: midOf(rooted.lower).joint,
        shortfall: rooted.shortfall,
        seed: { swivel: rooted.swivel, branch: rooted.branch },
      };
  }
  let solved: ReturnType<typeof hingedArmArticulation> = search(certifying);
  if (
    solved !== null &&
    certifying &&
    hingedSwivelAhead.rank(
      measure(solved.upper, solved.lower),
      ROM_TOLERANCE,
    ) !== hingedSwivelAhead.rank(solved.deviation, ROM_TOLERANCE)
  )
    solved = search(false);
  if (solved === null) return null;

  // The chosen candidate's root angles: one of the last two decomposed when
  // its score read them, else decomposed now, the same pure reading of the
  // same record.
  const upper: IAutoMovieJointPose = anglesOf(solved.upper);
  const lower: IAutoMovieJointPose = midOf(solved.lower).joint;
  return {
    hinge: prepared.hinge,
    upper,
    lower,
    shortfall: solved.shortfall,
    seed: {
      swivel: solved.swivel,
      branch: solved.branch,
      ...(admittedArc === null ? {} : { admitted: admittedArc }),
      ...(feasibleArc === null ? {} : { feasible: feasibleArc }),
      ...(vanished ? { vanished: true } : {}),
    },
    ...(strain === undefined
      ? {}
      : {
          value: {
            overshoot: solved.overshoot,
            error: certifying
              ? measure(solved.upper, solved.lower)
              : solved.deviation,
            strain: solved.second ?? 0,
          },
        }),
  };
}

/**
 * The end joint as its rotation error reads it (`fitHingedRotationError`): its
 * clinical basis, rest frame, range and the inverse of its fixed rest
 * rotation.
 */
interface IEnd {
  /** The end joint's clinical basis, admitted and normalized. */
  basis: IAutoMovieJointAxes;

  /** Its rest frame, when the rig gives one. */
  frame: IAutoMovieRestFrame | undefined;

  /** Its resolved range of motion. */
  constraint: IAutoMovieJointConstraint | null;

  /**
   * The inverse of the fixed rotation from the mid bone to the end joint's
   * rest.
   */
  restInverse: IAutoMovieQuaternion;
}

/**
 * Read the end joint as `fitHingedRotationError` reads it, from the rig when
 * one is lent.
 */
function endOf(
  props: IAutoMovieFitChainToTargetProps,
  rig: prepareChainFit.IRig,
): IEnd {
  const effector: AutoMovieHumanoidBone = props.chain.effector;
  const bone: IAutoMovieBone | undefined = rig.bone(effector);
  return {
    basis: rig.basis(effector, "decomposeJointRotation axes"),
    frame: props.restFrames?.[effector],
    constraint: getConstraint(effector, bone?.constraint ?? null),
    restInverse: rig.effectorRestInverse(),
  };
}

/**
 * How far inside a bound, in sine or projected units, a closed-form candidate
 * stands: past the rounding of the fit and of the decomposition, far under the
 * joints' tolerance.
 */
const INSIDE: number = 1e-7;

/**
 * Whether two arcs of swivels, degrees, share a swivel: the second taken in the
 * full turn that brings its centre nearest the first's.
 */
function overlapping(
  a: IAutoMovieSwivelArcs.IArc,
  b: IAutoMovieSwivelArcs.IArc,
): boolean {
  const shift: number =
    360 * Math.round((a.from + a.to - b.from - b.to) / 2 / 360);
  return b.from + shift <= a.to && a.from <= b.to + shift;
}

/** The hint side's full-weight distance (`hingedChainSide.SIDED`), metres. */
const SIDED: number = hingedChainSide.SIDED;

/**
 * What a candidate reads of its mid rotation alone, read once per rotation
 * record.
 */
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

/**
 * A root rotation's decomposed angles and the overshoot its chart choice scored
 * (NaN where it scored none).
 */
interface IAngles {
  /** The candidate's root rotation. */
  rotation: IAutoMovieQuaternion;

  /** Its clinical angles. */
  joint: IAutoMovieJointPose;

  /**
   * The gate's sum of those angles under the root's ungated constraint,
   * degrees; undefined where the chart choice scored none.
   */
  overshoot: number | undefined;
}

/**
 * What each candidate reads besides the hint's side, shared with its lazy exact
 * score.
 */
interface IReading {
  /**
   * The root's clinical angles; absent where its range read its rotation alone
   * and nothing needed them yet.
   */
  joint: IAutoMovieJointPose | undefined;

  /**
   * Completed world frame preceding the lower articulation, for this exact
   * upper candidate.
   */
  above: IAutoMovieQuaternion | undefined;

  /**
   * The mid joint's place, world metres; absent when task priority never reads
   * it.
   */
  mid: IAutoMovieVector3 | undefined;

  /** The mid bone's world rotation. */
  lowerWorld: IAutoMovieQuaternion | undefined;

  /**
   * Actual clinical effort for continuous-cost policy; unused zero in
   * task-priority mode.
   */
  effort: number;

  /** The ROM overshoot of both joints plus the obstruction, degrees. */
  overshoot: number;

  /**
   * Actual weighted reference turn for continuous-cost policy; task-priority
   * reads it lazily.
   */
  turned: number;

  /** Fixed branch's lower-reference turn, for lazy task-priority comparison. */
  midTurn: number;
}
