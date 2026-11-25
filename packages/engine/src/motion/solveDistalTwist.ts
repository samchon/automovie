import type {
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieSolveDistalTwist,
  IAutoMovieVector3,
} from "@automovie/interface";

import { decomposeJointRotationOnBasis } from "../kinematics/decomposeJointRotationOnBasis";
import { jointToQuaternionOnBasis } from "../kinematics/jointToQuaternionOnBasis";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { bracketedCrossing } from "../math/bracketedCrossing";
import { swingTwist } from "../math/swingTwist";
import { clampJointToSkeleton } from "../rom/clampJointToSkeleton";
import { getConstraint } from "../rom/getConstraint";
import { toClinicalAngle } from "../rom/toClinicalAngle";
import { prepareDistalTwistEffector } from "./prepareDistalTwistEffector";
import { prepareJointRotationProjection } from "./prepareJointRotationProjection";

/**
 * The twist a distally twisting mid bone (a forearm, which pronates and
 * supinates about its own length beyond the elbow's hinge) takes so its
 * effector (a wrist, which flexes and deviates but cannot twist) can reach a
 * requested rotation.
 *
 * The effector reads its rotation as clinical angles in its own Euler
 * convention, and the share it cannot take is that convention's twist. The mid
 * bone's twist composes last in its own articulation, `A = Abd Flex T(u, r)`,
 * so the effector's local rotation is `rest^-1 T(u, -r) K` with `K` fixed by
 * the pose above and the request. Explicit flexion-abduction-twist likewise
 * keeps the lower twist last and selects the corresponding matrix entries when
 * the effector uses that chart. The effector's rig twist is `atan2(P, Q)` of
 * two components of that rotation applied to its flexion (and, for a distal
 * effector, abduction) axis (`decomposeJointRotationOnBasis`), and each
 * component of a vector turned about `u` by `-r` is `alpha + beta cos r + gamma
 * sin r`. Asking the effector's twist to stand at its clinical zero is
 * therefore one equation `A + B cos r + C sin r = 0`, solved in closed form: at
 * most two forearm twists, the circle the hand turns on as the forearm twists
 * crossing the rotations the wrist's two angles make. Of those inside the
 * forearm's range, the range's two ends and the start, the one whose effector,
 * clamped to its own range, shows the request most nearly is taken, and between
 * equals the one nearest the start: the current twist plus the swing-twist
 * share (`swingTwist`) of the change from the effector's current rotation to
 * the requested one. So only the residual beyond the current pose moves, a
 * request near the current hand rotation prefers a nearby forearm twist. The
 * bounded candidate law is retained; it does not globally minimize over both
 * joints. Every candidate is ranked through the same effector projection that
 * final orientation uses. A continued solve (`reference`, the twist a fit of a
 * nearby pose chose) starts from that twist itself, clamped to the range, and
 * keeps its basin: the feasible value nearest the previous solution (Tolani,
 * Goswami and Badler 2000, section 3.2.4), the frame-to-frame coherence an
 * animation system's IK keeps (Aristidou et al. 2018, "Inverse kinematics
 * techniques in computer graphics: a survey", Comput. Graph. Forum 37:35,
 * section 7), where the least miss over all candidates jumps between the
 * range's ends as an unreachable request moves. The basin is the effector's
 * twist share `φ` beyond its zero, which the wrist misses by `|φ|` before its
 * own range clamps; `|φ|` peaks where `φ` is a half turn (the equation's other
 * root) and where `φ` turns back from zero (a second first-order equation), so
 * the peaks around the start bound its basin in closed form, and of the start,
 * the basin's root, its turning twist and the range ends inside it establish
 * the best candidate miss. Starting from the preceding twist, take the
 * crossing into that candidate's angular tolerance. The fit hands the
 * forearm in at its hinge's own twist, so the estimate reads the change from
 * that twist, and for a hand turned about half a turn from it (pointing down a
 * vertical sleeve beside the shoulder) it falls on either side of the peak
 * between the two ends, frame by frame.
 *
 * @param props The mid joint's and the effector's current clinical angles;
 *   `above`, the world rotation the mid joint's articulation composes after
 *   (its parent's world rotation and its rest); the mid and effector bases
 *   (normalized) and rest frames; the fixed lower-to-effector rotation,
 *   including unchanged intermediate bones and the effector rest; the requested
 *   effector world rotation; the skeleton whose ranges clamp; and, from a
 *   caller that solves many candidates, the two joints' clamps resolved once on
 *   that skeleton (`clampJointToSkeleton.of`) and optional shared effector
 *   projection prepared for those same axes, frame, domain and clamp. An
 *   optional effectorRestInverse must be Quaternion.inverse of that exact fixed
 *   rest frame; otherwise this solve computes it once for all trials. Optional
 *   articulation readers return this joint's raw composition, its
 *   rig-zero-twist composition and the actual held effector world-relative
 *   composition. They run at the original first-use sites; callers may share
 *   only unchanged joint/basis/frame inputs, never target-dependent answers. An
 *   optional composeLower belongs to this request on that same admitted lower
 *   basis/frame; it shares pure axis factors with the caller's immediate lower
 *   recomposition while still validating each joint and returning its fresh
 *   outer product; a private matching inner pair may also be shared. Optional
 *   preparedEffector borrows the fixed effector-frame readings from prepare
 *   under exactly the same rest, admitted basis and clinical frame.
 *   readHeldInverse may share Quaternion.inverse of the actual held raw
 *   quaternion. Its raw reader and angle/frame admission still run first, and
 *   the inverse callback runs only at the original inverse-use site. The
 *   target, preceding frame and admitted inputs stay unchanged throughout this
 *   synchronous solve, including while its pure readers/clamps run.
 * @returns The mid joint with its twist solved, clamped to the rig's range.
 */
export function solveDistalTwist(
  props: solveDistalTwist.IProps,
): IAutoMovieJointPose {
  return solve(props, false).joint;
}

/**
 * Solve once, optionally retaining only the selected candidate's actual
 * projection.
 */
function solve(
  props: Parameters<typeof solveDistalTwist>[0],
  paired: boolean,
): ISolution {
  // Each joint's clamp, resolved once for the call or handed in by a sweep
  // that resolved it once for all its candidates.
  const clampLower: (joint: IAutoMovieJointPose) => IAutoMovieJointPose =
    props.clamps?.lower ??
    clampJointToSkeleton.of(props.joint.bone, props.skeleton);
  const clampEffector: (joint: IAutoMovieJointPose) => IAutoMovieJointPose =
    props.clamps?.effector ??
    clampJointToSkeleton.of(props.effector.bone, props.skeleton);
  const suppliedProject: typeof props.projectEffector = props.projectEffector;
  let project: (rotation: IAutoMovieQuaternion) => IAutoMovieJointPose;
  let projectWithQuaternion: typeof props.projectEffectorWithQuaternion;
  if (suppliedProject === undefined) {
    const preparedProject: prepareJointRotationProjection.IProjector =
      prepareJointRotationProjection({
        domain: {
          bone: props.effector.bone,
          constraint: getConstraint(
            props.effector.bone,
            props.skeleton.bones.find(
              (bone: IAutoMovieBone): boolean =>
                bone.bone === props.effector.bone,
            )?.constraint ?? null,
          ),
        },
        basis: props.effectorBasis,
        frame: props.effectorFrame,
        clamp: clampEffector,
      });
    project = preparedProject;
    projectWithQuaternion =
      props.projectEffectorWithQuaternion ?? preparedProject.withQuaternion;
  } else {
    project = suppliedProject;
    projectWithQuaternion = props.projectEffectorWithQuaternion;
  }
  const readings: { twist: number; joint: IAutoMovieJointPose }[] | undefined =
    clampJointToSkeleton.borrow(clampLower) === undefined ? undefined : [];
  const at: (twist: number) => IAutoMovieJointPose = (
    twist: number,
  ): IAutoMovieJointPose => {
    if (readings !== undefined)
      for (const reading of readings)
        if (Object.is(reading.twist, twist)) return reading.joint;
    const joint: IAutoMovieJointPose = clampLower({ ...props.joint, twist });
    readings?.push({ twist, joint });
    return joint;
  };
  const effectorRestInverse: IAutoMovieQuaternion =
    props.effectorRestInverse ?? Quaternion.inverse(props.effectorRest);
  let composeLower:
    | ReturnType<typeof jointToQuaternionOnBasis.prepare>
    | undefined = props.composeLower;

  /** Keep exact axis factors only for this solve's changing lower joint. */
  const lowerRotation: ReturnType<typeof jointToQuaternionOnBasis.prepare> = (
    joint: Parameters<ReturnType<typeof jointToQuaternionOnBasis.prepare>>[0],
  ): IAutoMovieQuaternion => {
    composeLower ??= jointToQuaternionOnBasis.prepare(
      props.lowerBasis,
      props.lowerFrame,
    );
    return composeLower(joint);
  };
  const effectorOf: (joint: IAutoMovieJointPose) => IAutoMovieQuaternion = (
    joint: IAutoMovieJointPose,
  ): IAutoMovieQuaternion => {
    // The same three coordinates on this fixed basis/frame compose the
    // original articulation, so its already completed needed rotation is exact.
    const unchanged: boolean =
      Object.is(joint.flexion, props.joint.flexion) &&
      Object.is(joint.abduction, props.joint.abduction) &&
      Object.is(joint.twist, props.joint.twist);
    const carried: IAutoMovieQuaternion = unchanged
      ? needed
      : Quaternion.multiply(
          Quaternion.inverse(
            Quaternion.multiply(props.above, lowerRotation(joint)),
          ),
          props.rotation,
        );
    return Quaternion.normalize(
      Quaternion.multiply(effectorRestInverse, carried),
    );
  };

  // How far the effector, clamped to its range, shows its asked rotation.
  const chord: ReturnType<typeof prepareJointRotationProjection.wristChord> =
    prepareJointRotationProjection.wristChord(projectWithQuaternion);
  let latestProjection: solveDistalTwist.IProjection | undefined;
  const missed: (twist: number, demand?: IAutoMovieQuaternion) => number = (
    twist: number,
    demand?: IAutoMovieQuaternion,
  ): number => {
    const local: IAutoMovieQuaternion = demand ?? effectorOf(at(twist));
    let effector: IAutoMovieJointPose;
    let shown: IAutoMovieQuaternion;
    if (projectWithQuaternion === undefined) {
      effector = project(local);
      shown = jointToQuaternionOnBasis(
        effector,
        props.effectorBasis,
        props.effectorFrame,
      );
    } else {
      const projected: prepareJointRotationProjection.IProjection =
        projectWithQuaternion(local);
      effector = projected.joint;
      shown = projected.quaternion;
    }
    if (paired)
      latestProjection = {
        local,
        joint: {
          bone: effector.bone,
          flexion: effector.flexion,
          abduction: effector.abduction,
          twist: effector.twist,
        },
        quaternion: { x: shown.x, y: shown.y, z: shown.z, w: shown.w },
      };
    return Quaternion.angleAfterNormalize(shown, local);
  };

  // The start: the current twist plus the twist, about the mid bone's axis,
  // of the change from the effector's current rotation to the requested one.
  const articulated: IAutoMovieQuaternion =
    props.readArticulated?.() ?? lowerRotation(props.joint);
  const needed: IAutoMovieQuaternion = Quaternion.multiply(
    Quaternion.inverse(Quaternion.multiply(props.above, articulated)),
    props.rotation,
  );
  const held: IAutoMovieQuaternion =
    props.readHeldRotation?.() ??
    Quaternion.multiply(
      props.effectorRest,
      jointToQuaternionOnBasis(
        props.effector,
        props.effectorBasis,
        props.effectorFrame,
      ),
    );
  const { twist }: ReturnType<typeof swingTwist> = swingTwist(
    Quaternion.normalize(
      Quaternion.multiply(
        needed,
        props.readHeldInverse?.(held) ?? Quaternion.inverse(held),
      ),
    ),
    props.lowerBasis.twist,
  );
  const turned: number =
    decomposeJointRotationOnBasis(
      Quaternion.normalize(Quaternion.multiply(articulated, twist)),
      props.lowerBasis,
      props.lowerFrame,
    ).twist ?? 0;
  // A continued solve starts from the twist it continues (Tolani, Goswami
  // and Badler 2000: the feasible value nearest the previous solution), not
  // from the estimate: the fit hands the forearm in at its hinge's own twist,
  // so the estimate reads the change from that twist, and for a hand turned
  // about half a turn from it the estimate falls on either side of the
  // barrier between the range's ends, frame by frame.
  const start: number = at(props.reference ?? turned).twist ?? 0;

  // K: the request seen from the mid bone's articulation before its twist.
  const untwisted: IAutoMovieQuaternion =
    props.readUntwisted?.() ??
    lowerRotation({
      ...props.joint,
      twist: toClinicalAngle(0, props.lowerFrame?.twist),
    });
  // Both raw readers still ran. Equal components on this query's unchanged
  // above/request give the same original multiply-inverse-multiply result.
  const sameRawRotation: boolean =
    Object.is(articulated.x, untwisted.x) &&
    Object.is(articulated.y, untwisted.y) &&
    Object.is(articulated.z, untwisted.z) &&
    Object.is(articulated.w, untwisted.w);
  const K: IAutoMovieQuaternion = sameRawRotation
    ? needed
    : Quaternion.multiply(
        Quaternion.inverse(Quaternion.multiply(props.above, untwisted)),
        props.rotation,
      );
  const u: IAutoMovieVector3 = props.lowerBasis.twist;
  const e: IAutoMovieJointAxes = props.effectorBasis;
  const fixed: solveDistalTwist.IPrepared =
    props.preparedEffector ??
    solveDistalTwist.prepare({
      effectorRest: props.effectorRest,
      effectorBasis: e,
      effectorFrame: props.effectorFrame,
    });
  const abduction: IAutoMovieVector3 = fixed.abduction();
  let previousNormal: IAutoMovieVector3 | undefined;
  let normalProjection: number | undefined;
  let previousVector: IAutoMovieVector3 | undefined;
  let vectorProjection: number | undefined;
  let vectorCross: IAutoMovieVector3 | undefined;
  // n . T(u, -r) x = alpha + beta cos r + gamma sin r (Rodrigues).
  const harmonic: (
    n: IAutoMovieVector3,
    x: IAutoMovieVector3,
  ) => [number, number, number] = (
    n: IAutoMovieVector3,
    x: IAutoMovieVector3,
  ): [number, number, number] => {
    if (previousNormal !== n || normalProjection === undefined) {
      previousNormal = n;
      normalProjection = Vector3.dot(n, u);
    }
    if (previousVector !== x) {
      previousVector = x;
      vectorProjection = undefined;
      vectorCross = undefined;
    }
    const along: number =
      normalProjection * (vectorProjection ??= Vector3.dot(u, x));
    const across: number = Vector3.dot(n, x) - along;
    vectorCross ??= Vector3.cross(u, x);
    return [along, across, -Vector3.dot(n, vectorCross)];
  };
  const x: IAutoMovieVector3 = Quaternion.rotateVector(K, e.flexion);
  // Explicit F·A·T reads twist from minus the flexion/abduction matrix
  // entry and the flexion diagonal, as the inverse chart does.
  const charted: boolean = e.rotationOrder === "flexion-abduction-twist";
  const [P, Q]: [number, number, number][] = charted
    ? [
        harmonic(fixed.flexion(), Quaternion.rotateVector(K, e.abduction)),
        harmonic(fixed.flexion(), x),
      ]
    : e.twistPlacement === "distal"
      ? [
          harmonic(abduction, x),
          harmonic(abduction, Quaternion.rotateVector(K, e.abduction)),
        ]
      : [harmonic(abduction, x), harmonic(fixed.flexion(), x)];
  const { cosine, sine }: solveDistalTwist.IZero = fixed.zero();
  const [A, B, C]: number[] = [0, 1, 2].map(
    (i: number): number => (charted ? -P[i]! : P[i]!) * cosine - Q[i]! * sine,
  );

  // The forearm's range, and the clinical twist of each solution inside it.
  const low: number = at(-1e6).twist ?? 0;
  const high: number = at(1e6).twist ?? 0;
  const candidates: number[] = [low, high, start];
  for (const r of sinusoidZeros([A!, B!, C!])) {
    const clinical: number =
      toClinicalAngle((r * 180) / Math.PI, props.lowerFrame?.twist) ?? 0;
    // The alias of the solution nearest the range's middle.
    const middle: number = (low + high) / 2;
    candidates.push(clinical - 360 * Math.round((clinical - middle) / 360));
  }

  // The candidate whose clamped effector misses least; between equals, the
  // nearest to the start.
  let chosen: number = start;
  let least: number = missed(start);
  let chosenProjection: solveDistalTwist.IProjection | undefined =
    latestProjection;

  // A start the effector shows within TIE can be neither beaten, since no
  // miss is below zero, nor tied by a twist nearer to itself.
  if (least <= TIE && at(start).twist === start)
    return { joint: at(start), projection: chosenProjection };

  // A continued solve keeps the start's basin (Tolani, Goswami and Badler
  // 2000: the feasible value nearest the previous solution), the basin of
  // the effector's twist share `φ = atan2(E, G)` beyond its clinical zero,
  // `E = R sin φ` the equation above and `G = R cos φ`: the wrist cannot
  // twist, so it misses its request by `|φ|` before its own range clamps.
  // `|φ|` peaks where `φ` is a half turn (the equation's root with `G < 0`)
  // and where `φ` turns back away from zero (`E G' - G E' = 0`, itself
  // first-order in the twist), so those twists bound the start's basin, in
  // closed form. Its least, at its other root, its other turning twist or a
  // range end it meets, sets the tolerance by the actual miss. The
  // least miss over every candidate jumps from one end of the range to the
  // other where an unreachable request's two ends cross, between two frames,
  // and a descent over sparse candidates hops a peak between neighbours;
  // the basin moves with the request instead.
  if (props.reference !== undefined) {
    const startMiss: number = least;
    const startProjection: solveDistalTwist.IProjection | undefined =
      chosenProjection;
    const G: number[] = [0, 1, 2].map(
      (i: number): number => (charted ? -P[i]! : P[i]!) * sine + Q[i]! * cosine,
    );
    const E: number[] = [A!, B!, C!];
    // E G' - G E' = k0 + k1 cos r + k2 sin r (both first-order sinusoids).
    const turning: number[] = [
      B! * G[2]! - C! * G[1]!,
      A! * G[2]! - G[0]! * C!,
      G[0]! * B! - A! * G[1]!,
    ];
    const clinicalOf = (r: number): number =>
      toClinicalAngle((r * 180) / Math.PI, props.lowerFrame?.twist) ?? 0;
    const peaks: number[] = [];
    const troughs: number[] = [];
    for (const r of sinusoidZeros(E)) {
      const g: number = sinusoidAt(G, r);
      if (g !== 0) (g < 0 ? peaks : troughs).push(clinicalOf(r));
    }
    for (const r of sinusoidZeros(turning)) {
      // φ' = -(E G' - G E') / R², so φ'' there has the sign of
      // k1 sin r - k2 cos r: a peak of |φ| where it and φ differ in sign.
      const side: number =
        Math.atan2(sinusoidAt(E, r), sinusoidAt(G, r)) *
        (turning[1]! * Math.sin(r) - turning[2]! * Math.cos(r));
      if (side !== 0) (side < 0 ? peaks : troughs).push(clinicalOf(r));
    }
    let below: number = -Infinity;
    let above: number = Infinity;
    for (const peak of peaks) {
      const under: number = peak + 360 * Math.floor((start - peak) / 360);
      below = Math.max(below, under);
      above = Math.min(above, under + 360);
    }
    const from: number = Math.max(low, below);
    const to: number = Math.min(high, above);
    const basin: number[] = [start];
    if (from === low) basin.push(low);
    if (to === high) basin.push(high);
    for (const t of troughs) {
      const alias: number = t - 360 * Math.round((t - start) / 360);
      if (alias >= from && alias <= to) basin.push(alias);
    }
    for (const t of new Set<number>(basin)) {
      if (t === chosen) continue;
      const m: number = missed(t);
      if (
        m < least ||
        (m === least && Math.abs(t - start) < Math.abs(chosen - start))
      ) {
        chosen = t;
        least = m;
        chosenProjection = latestProjection;
      }
    }
    const ceiling: number = least + TIE;
    if (startMiss <= ceiling)
      return { joint: at(start), projection: startProjection };

    // Project the previous twist onto this branch's error band. At a simple
    // crossing its boundary approaches the start as the excess approaches
    // zero. Switching straight to the best candidate would jump in angle.
    // Dowell and Jarratt (1971) close the bracket from its two known scores.
    const direction: number = Math.sign(chosen - start);
    const travel: number = Math.abs(chosen - start);
    const { high: inBand } = bracketedCrossing({
      f: (distance: number): number =>
        missed(start + direction * distance) - ceiling,
      past: (error: number): boolean => error <= 0,
      low: 0,
      high: travel,
      known: { low: startMiss - ceiling, high: least - ceiling },
      tolerance: (TIE * 180) / Math.PI,
    });
    if (inBand === travel)
      return { joint: at(chosen), projection: chosenProjection };
    const boundary: number = start + direction * inBand;
    if (paired) missed(boundary);
    return { joint: at(boundary), projection: latestProjection };
  }

  // A candidate that clamps to a twist already read is the same pose: the
  // same miss, never strictly nearer, so it is not read again.
  const read: Set<number> = new Set([at(start).twist ?? 0]);
  for (const t of candidates) {
    const clamped: number = at(t).twist ?? 0;
    if (read.has(clamped)) continue;
    read.add(clamped);
    let demand: IAutoMovieQuaternion | undefined;
    if (chord !== undefined) {
      demand = effectorOf(at(t));

      // A candidate beyond even the nearest-start tie cannot win. Reserve
      // a second tie width for the original normalized Hamilton/atan2 score's
      // rounding. The lower bound is squared, so this needs no angle read.
      const outside: number = least + 2 * TIE;
      if (chord(demand) > outside * outside) continue;
    }
    const m: number = missed(t, demand);
    if (
      m < least - TIE ||
      (Math.abs(m - least) <= TIE &&
        Math.abs((at(t).twist ?? 0) - start) <
          Math.abs((at(chosen).twist ?? 0) - start))
    ) {
      chosen = t;
      least = m;
      chosenProjection = latestProjection;
    }
  }
  return { joint: at(chosen), projection: chosenProjection };
}

/**
 * Existing distal-candidate angular tie policy, radians; this is not a
 * numerical-roundoff bound or a reached-target threshold.
 */
const TIE: number = 1e-6;

/** `h[0] + h[1] cos r + h[2] sin r`, `r` radians. */
function sinusoidAt(h: readonly number[], r: number): number {
  return h[0]! + h[1]! * Math.cos(r) + h[2]! * Math.sin(r);
}

/**
 * The at most two angles, radians, where `h[0] + h[1] cos r + h[2] sin r` is
 * zero: `atan2(h[2], h[1]) ± acos(-h[0] / R)`, `R` the harmonic's amplitude;
 * none where it never reaches zero or has no amplitude.
 */
function sinusoidZeros(h: readonly number[]): number[] {
  const radius: number = Math.hypot(h[1]!, h[2]!);
  if (!(radius > 1e-12) || Math.abs(h[0]!) > radius) return [];
  const centre: number = Math.atan2(h[2]!, h[1]!);
  const spread: number = Math.acos(Math.max(-1, Math.min(1, -h[0]! / radius)));
  return [centre + spread, centre - spread];
}

/** Internal joint-only and paired modes share one candidate search. */
interface ISolution {
  /** Selected actual clamped mid articulation. */
  joint: IAutoMovieJointPose;

  /** Retained only in paired mode, after at least the start was scored. */
  projection: solveDistalTwist.IProjection | undefined;
}

/**
 * Fixed-source effector readers and one solve's paired candidate/result
 * records.
 */
export namespace solveDistalTwist {
  /**
   * A candidate's exact local demand and raw displayed effector articulation.
   *
   * The local demand and selected articulation belong to the same actual query
   * under fixed basis/rest/domain/clamp dependencies. The joint is copied in
   * clinical degrees and the quaternion remains raw, preserving final display's
   * normalization boundary. No score or approximate key replaces the original
   * demand.
   */
  export interface IProjection {
    /** Normalized local target used by that candidate's actual projector query. */
    local: IAutoMovieQuaternion;

    /**
     * Actual selected effector articulation in clinical degrees, copied for
     * this result.
     */
    joint: IAutoMovieJointPose;

    /** Its selected raw articulation, before the score's normalization. */
    quaternion: IAutoMovieQuaternion;
  }

  /**
   * The selected lower joint paired with its completed effector projection.
   *
   * This joint is the lower articulation; projection.joint is the effector.
   * Both describe the same bounded-search winner. A paired solve always scores
   * its start, so projection is required, and consumers recompute their actual
   * demand from the selected lower clamp before reuse.
   */
  export interface IResult {
    /** Selected clamped mid joint, with the ordinary entry's ownership. */
    joint: IAutoMovieJointPose;

    /** Actual selected-candidate projection, retained from the bounded search. */
    projection: IProjection;
  }

  /**
   * Run the identical bounded candidate law and also return the winning
   * candidate's completed local demand and raw effector projection. A consumer
   * may reuse that projection only for a component-identical local demand under
   * the same unchanged projector dependencies. The final lower joint is the
   * actual clamp and the consumer recomputes its demand; an earlier score never
   * substitutes a different requested rotation.
   *
   * One selected fixed-size reading survives the solve; at most the current and
   * selected readings are retained during it, with no target history. Candidate
   * count, score/tie order and every numerical projection in the solve remain
   * unchanged. Callers release the fresh result after composing the actual
   * displayed world rotation.
   *
   * Ordinary and paired entries share one search, candidate order and TIE.
   * Paired mode only retains the winning query's actual effector joint/raw
   * quaternion and local target, adding fixed-size current/selected readings.
   * Exact matching avoids another projection; a different demand still runs its
   * own query. These readings never cross targets or operations and the
   * selected caller-owned result retains no solver, history or handles.
   */
  export function withProjection(
    props: Parameters<typeof solveDistalTwist>[0],
  ): IResult {
    const result: ISolution = solve(props, true);
    return { joint: result.joint, projection: result.projection! };
  }

  /** The interface contract (`IAutoMovieSolveDistalTwist.IZero`). */
  export type IZero = IAutoMovieSolveDistalTwist.IZero;

  /** The interface contract (`IAutoMovieSolveDistalTwist.IPrepared`). */
  export type IPrepared = IAutoMovieSolveDistalTwist.IPrepared;

  /**
   * Borrow one operation's unchanged effector rest, admitted basis and clinical
   * frame. Construction admits no angle or unused frame. Each reader computes
   * its original expression once, where a solve first needs it, then lends the
   * derived record unchanged. Release the object with this operation; a new
   * rest, basis or clinical frame requires a new preparation.
   */
  export function prepare(
    props: Pick<
      Parameters<typeof solveDistalTwist>[0],
      "effectorRest" | "effectorBasis" | "effectorFrame"
    >,
  ): IPrepared {
    return prepareDistalTwistEffector(props);
  }

  /**
   * The solve's props: the interface demand with optional readers and
   * projectors an operation prepared once for this same chain.
   */
  export interface IProps extends IAutoMovieSolveDistalTwist.IProps {
    /**
     * The inverse of `effectorRest`, already computed; absent, the solve
     * inverts it.
     */
    effectorRestInverse?: IAutoMovieQuaternion;

    /**
     * The effector's clinical projection of a raw rotation; absent, the solve
     * prepares it from the effector's basis and frame.
     */
    projectEffector?: (rotation: IAutoMovieQuaternion) => IAutoMovieJointPose;

    /**
     * The same projection paired with its raw quaternion; absent, the prepared
     * projector's own paired reader is used.
     */
    projectEffectorWithQuaternion?: (
      rotation: IAutoMovieQuaternion,
    ) => prepareJointRotationProjection.IProjection;

    /**
     * The mid bone's articulated rotation at `joint`; absent, it is composed
     * from the joint.
     */
    readArticulated?: () => IAutoMovieQuaternion;

    /**
     * The mid bone's rotation with its twist removed; absent, it is composed
     * from the joint.
     */
    readUntwisted?: () => IAutoMovieQuaternion;

    /**
     * The effector's held world rotation; absent, it is composed from `above`
     * and the mid bone.
     */
    readHeldRotation?: () => IAutoMovieQuaternion;

    /** The inverse of a held rotation; absent, the solve inverts it. */
    readHeldInverse?: (heldRaw: IAutoMovieQuaternion) => IAutoMovieQuaternion;

    /**
     * The mid bone's prepared clinical composition on its basis; absent, the
     * solve composes it directly.
     */
    composeLower?: ReturnType<typeof jointToQuaternionOnBasis.prepare>;

    /**
     * The effector's fixed-source readers (`prepare`); absent, the solve
     * prepares them.
     */
    preparedEffector?: IPrepared;
  }
}
