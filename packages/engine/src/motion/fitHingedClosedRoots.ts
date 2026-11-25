import type {
  IAutoMovieAngleRange,
  IAutoMovieHingedArmSwivel,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedJointAngles,
  IAutoMovieRestFrame,
  IAutoMovieSwivelArcs,
  IAutoMovieSwivelNear,
  IAutoMovieVector3,
} from "@automovie/interface";

import { decomposeJointRotationOnBasis } from "../kinematics/decomposeJointRotationOnBasis";
import { hingedArmSwivel } from "../kinematics/hingedArmSwivel";
import { swivelArcs } from "../kinematics/swivelArcs";
import { swivelJointReadings } from "../kinematics/swivelJointReadings";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { ROM_TOLERANCE } from "../rom/constants/ROM_TOLERANCE";
import { prepareChainPlant } from "./prepareChainPlant";

/**
 * Answer a hinged fit that asks an effector rotation from the swivels its
 * effector joint closes, in one straight pass: the leg's case, whose ankle
 * holds one clinical axis immobile.
 *
 * With the hinge angle fixed by the reach, the effector joint's rotation is a
 * function of the swivel alone, and the immobile axis reads its clinical zero
 * at the roots of one sinusoid (`immobileAxisSwivels`' own reading, entry by
 * entry, of which only the immobile axis's entries are sampled here). Each root
 * is one candidate, scored by the caller's own reading. A candidate whose
 * effector joint reads inside its box by more than the range tolerance, with
 * the immobile axis within the projector's admission width of zero, is shown by
 * the joint projection unchanged, so its displayed rotation error is the
 * rounding of one recomposition and the candidate is met without being
 * measured; any other candidate is measured by the caller's exact error.
 *
 * The answer is the general search's closed stage's: the least exact score
 * among the candidates without overshoot, accepted when it is met. It is
 * returned only where that order is certain without the unmeasured errors,
 * which lie within the range tolerance: the chosen candidate's deviation is
 * below every other's lower bound by more than that tolerance. Everything else
 * (no root, no candidate without overshoot, a choice the tolerance could turn,
 * an unmet best) returns null, and the general search answers.
 *
 * @param props The prepared chain, the target's prepared swivel geometry, the
 *   continuation seed if any, the requested effector rotation in the model
 *   frame, the effector joint, the caller's candidate reading and its exact
 *   displayed error.
 * @returns The chosen candidate, or null where the general search must answer.
 */
export function fitHingedClosedRoots(
  props: fitHingedClosedRoots.IProps,
): fitHingedClosedRoots.ISolved | null {
  const constraint: IAutoMovieJointConstraint | null = props.end.constraint;
  if (
    props.end.basis.rotationOrder !== undefined ||
    constraint === null ||
    (constraint.swingTwist !== undefined && constraint.swingTwist !== null) ||
    (constraint.swingDeg !== undefined && constraint.swingDeg !== null)
  )
    return null;
  const immobile: swivelJointReadings.Axis[] = swivelJointReadings.AXES.filter(
    (axis: swivelJointReadings.Axis): boolean => constraint[axis] === null,
  );
  if (immobile.length !== 1) return null;
  const found: IAutoMovieHingedArmSwivel.IStop[] | null =
    props.geometry.branches();
  if (found === null) return null;

  const basis: IAutoMovieJointAxes = props.end.basis;
  const frame: IAutoMovieRestFrame | undefined = props.end.frame;
  const handed: 1 | -1 =
    Vector3.dot(basis.twist, Vector3.cross(basis.flexion, basis.abduction)) >= 0
      ? 1
      : -1;
  const axes: readonly IAutoMovieVector3[] = [
    basis.flexion,
    basis.abduction,
    Vector3.scale(basis.twist, handed),
  ];
  const local = (
    above: IAutoMovieQuaternion,
    lower: IAutoMovieQuaternion,
  ): IAutoMovieQuaternion =>
    Quaternion.normalize(
      Quaternion.multiply(
        props.end.restInverse,
        Quaternion.multiply(
          Quaternion.inverse(Quaternion.multiply(above, lower)),
          props.rotation,
        ),
      ),
    );
  const roots = (posed: ReturnType<typeof hingedArmSwivel.pose>): number[] => {
    const sampled: IAutoMovieQuaternion[] = SAMPLES.map(
      (swivel: number): IAutoMovieQuaternion => {
        const at: ReturnType<ReturnType<typeof hingedArmSwivel.pose>> =
          posed(swivel);
        return local(
          Quaternion.multiply(
            Quaternion.multiply(props.prepared.upper.worldRotation, at.upper),
            props.prepared.lowerRotation,
          ),
          at.lower,
        );
      },
    );
    const entry = (i: number, j: number): IAutoMovieSwivelArcs.ISinusoid =>
      swivelArcs.fitted(
        Vector3.dot(axes[i]!, Quaternion.rotateVector(sampled[0]!, axes[j]!)),
        Vector3.dot(axes[i]!, Quaternion.rotateVector(sampled[1]!, axes[j]!)),
        Vector3.dot(axes[i]!, Quaternion.rotateVector(sampled[2]!, axes[j]!)),
      );
    const axis: swivelJointReadings.Axis = immobile[0]!;
    const distal: boolean = basis.twistPlacement === "distal";
    const neutral: number =
      swivelJointReadings.rig({ min: 0, max: 0 }, frame?.[axis])[0] *
      Quaternion.DEG2RAD;
    // The reading of each clinical axis, as `swivelJointReadings.of` gives it.
    if (axis === (distal ? "flexion" : "abduction")) {
      const sine: IAutoMovieSwivelArcs.ISinusoid = swivelArcs.scaled(
        distal ? entry(1, 2) : entry(2, 0),
        -1,
      );
      return swivelArcs.roots({ ...sine, a: sine.a - Math.sin(neutral) });
    }
    const y: IAutoMovieSwivelArcs.ISinusoid =
      axis === "twist" ? entry(1, 0) : distal ? entry(0, 2) : entry(2, 1);
    const x: IAutoMovieSwivelArcs.ISinusoid =
      axis === "twist" ? (distal ? entry(1, 1) : entry(0, 0)) : entry(2, 2);
    const turn: 1 | -1 = axis === "twist" ? handed : 1;
    return swivelArcs.roots(
      swivelArcs.combined(
        y,
        Math.cos(neutral * turn),
        x,
        -Math.sin(neutral * turn),
      ),
    );
  };

  // The candidates, in the order the general search meets them.
  const candidates: ICandidate[] = [];
  const probe = (
    posed: ReturnType<typeof hingedArmSwivel.pose>,
    stop: IAutoMovieHingedArmSwivel.IStop,
    branch: number,
    swivel: number,
  ): void => {
    const at: ReturnType<ReturnType<typeof hingedArmSwivel.pose>> =
      posed(swivel);
    const scored: fitHingedClosedRoots.IScore | null = props.score(
      at.upper,
      at.lower,
    );
    if (scored === null || scored.overshoot !== 0) return;
    const read: IAutoMovieResolvedJointAngles = decomposeJointRotationOnBasis(
      local(scored.above, at.lower),
      basis,
      frame,
    );
    const shown: boolean = swivelJointReadings.AXES.every(
      (axis: swivelJointReadings.Axis): boolean => {
        const range: IAutoMovieAngleRange | null = constraint[axis];
        return range === null
          ? Math.abs(read[axis]) <= ADMITTED
          : read[axis] >= range.min + ROM_TOLERANCE &&
              read[axis] <= range.max - ROM_TOLERANCE;
      },
    );
    candidates.push({
      upper: at.upper,
      lower: at.lower,
      joint: scored.joint,
      above: scored.above,
      overshoot: scored.overshoot,
      deviation: scored.deviation,
      swivel,
      branch,
      stop,
      shown,
      least: shown
        ? scored.deviation
        : scored.deviation + props.error(at.upper, at.lower, scored.above),
    });
  };
  const near: IAutoMovieSwivelNear | undefined = props.near;
  if (near !== undefined) {
    if (!(near.tolerance > 0)) return null;
    const branch: number = Math.min(near.branch, found.length - 1);
    const stop: IAutoMovieHingedArmSwivel.IStop = found[branch]!;
    const posed: ReturnType<typeof hingedArmSwivel.pose> = props.geometry.pose(
      stop.theta,
    );
    for (const angle of roots(posed)) {
      const turn: number = angle - near.swivel;
      const delta: number = turn - 360 * Math.round(turn / 360);
      if (!(Math.abs(delta) < hingedArmSwivel.STEP)) continue;
      probe(
        posed,
        stop,
        branch,
        delta === 0 ? near.swivel : near.swivel + delta,
      );
    }
  } else {
    let shortfall: number = Infinity;
    for (const stop of found) shortfall = Math.min(shortfall, stop.shortfall);
    found.forEach(
      (stop: IAutoMovieHingedArmSwivel.IStop, branch: number): void => {
        if (
          stop.shortfall !== shortfall ||
          found.findIndex(
            (other: IAutoMovieHingedArmSwivel.IStop): boolean =>
              other.theta === stop.theta,
          ) !== branch
        )
          return;
        const posed: ReturnType<typeof hingedArmSwivel.pose> =
          props.geometry.pose(stop.theta);
        for (const angle of roots(posed)) probe(posed, stop, branch, angle);
      },
    );
  }

  // The least exact score among the candidates without overshoot is a shown
  // one only where its deviation, which bounds its exact score from below and
  // within the tolerance from above, clears every other's lower bound.
  let best: ICandidate | null = null;
  for (const candidate of candidates)
    if (
      candidate.overshoot === 0 &&
      candidate.shown === true &&
      (best === null || candidate.deviation < best.deviation)
    )
      best = candidate;
  if (best === null) return null;
  for (const other of candidates)
    if (
      other !== best &&
      other.overshoot === 0 &&
      !(other.least > best.deviation + ROM_TOLERANCE)
    )
      return null;
  return {
    upper: best.upper,
    lower: best.lower,
    joint: best.joint,
    swivel: best.swivel,
    branch: best.branch,
    shortfall: best.stop.shortfall,
  };
}

/**
 * The request, the caller's candidate reading and the answer of a closed-root
 * fit.
 */
export namespace fitHingedClosedRoots {
  /**
   * What a closed-root answer reads, each input in the frame the general search
   * holds it in.
   */
  export interface IProps {
    /**
     * The chain's preparation, for the upper bone's world rotation and the
     * fixed frame between the upper and the hinged bone.
     */
    prepared: NonNullable<ReturnType<typeof prepareChainPlant>>;

    /**
     * The target's prepared swivel geometry: its hinge branches and each
     * branch's upper and lower rotation by swivel.
     */
    geometry: hingedArmSwivel.IPreparedTarget;

    /** The continuation seed, when the fit continues one. */
    near: IAutoMovieSwivelNear | undefined;

    /**
     * The requested effector rotation in the model frame, as the general
     * search's root reading takes it.
     */
    rotation: IAutoMovieQuaternion;

    /**
     * The effector joint: its clinical basis, rest frame, range and the inverse
     * of its rest rotation in the hinged bone's frame.
     */
    end: {
      basis: IAutoMovieJointAxes;
      frame: IAutoMovieRestFrame | undefined;
      constraint: IAutoMovieJointConstraint | null;
      restInverse: IAutoMovieQuaternion;
    };

    /** The candidate's reading by its bone-local upper and lower rotations. */
    score: (
      upper: IAutoMovieQuaternion,
      lower: IAutoMovieQuaternion,
    ) => IScore | null;

    /**
     * The exact displayed rotation error, degrees, of a candidate, given its
     * completed prefix `(upper world * upper) * fixed lower frame`.
     */
    error: (
      upper: IAutoMovieQuaternion,
      lower: IAutoMovieQuaternion,
      above: IAutoMovieQuaternion,
    ) => number;
  }

  /** One candidate's reading, as the general search's score reads it. */
  export interface IScore {
    /** The upper joint's clinical record of this candidate. */
    joint: IAutoMovieJointPose;

    /** The completed prefix `(upper world * upper) * fixed lower frame`. */
    above: IAutoMovieQuaternion;

    /**
     * Range overshoot of the upper and hinged joints plus any obstruction, zero
     * when legal.
     */
    overshoot: number;

    /**
     * The score without the displayed rotation error, which the exact score
     * adds.
     */
    deviation: number;
  }

  /** The chosen candidate, in the records the swivel pose and the score issued. */
  export interface ISolved {
    /** The upper bone's local rotation, the swivel pose's own record. */
    upper: IAutoMovieQuaternion;

    /** The hinged bone's local rotation, the swivel pose's own record. */
    lower: IAutoMovieQuaternion;

    /** The upper joint's clinical record, as the score read it. */
    joint: IAutoMovieJointPose;

    /** The chosen swivel, degrees. */
    swivel: number;

    /** The chosen hinge branch. */
    branch: number;

    /** The reach's shortfall on that branch, metres. */
    shortfall: number;
  }
}

interface ICandidate extends fitHingedClosedRoots.IScore {
  upper: IAutoMovieQuaternion;
  lower: IAutoMovieQuaternion;
  swivel: number;
  branch: number;
  stop: IAutoMovieHingedArmSwivel.IStop;
  shown?: boolean;

  /** A lower bound of the exact score: the exact score itself once measured. */
  least: number;
}

/**
 * The swivels, degrees, that fix a sinusoid of the swivel
 * (`swivelJointReadings.of`'s).
 */
const SAMPLES: readonly number[] = [0, 90, 180];

/**
 * The joint projection's admission width, degrees
 * (`prepareJointRotationProjection`'s `admitted`).
 */
const ADMITTED: number = 1e-9;
