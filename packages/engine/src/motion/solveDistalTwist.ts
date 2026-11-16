import type {
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

import { decomposeJointRotationOnBasis } from "../kinematics/decomposeJointRotationOnBasis";
import { jointToQuaternionOnBasis } from "../kinematics/jointToQuaternionOnBasis";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { swingTwist } from "../math/swingTwist";
import type { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { clampJointToSkeleton } from "../rom/clampJointToSkeleton";
import { getConstraint } from "../rom/getConstraint";
import { toClinicalAngle } from "../rom/toClinicalAngle";
import { toRigAngle } from "../rom/toRigAngle";
import { prepareJointRotationProjection } from "./prepareJointRotationProjection";

/**
 * The twist a distally twisting mid bone (a forearm, which pronates and
 * supinates about its own length beyond the elbow's hinge) takes so its
 * effector (a wrist, which flexes and deviates but cannot twist) can reach a
 * requested rotation.
 *
 * The effector reads its rotation as clinical angles in its own Euler
 * convention, and the share it cannot take is that convention's twist. The
 * mid bone's twist composes last in its own articulation, `A = Abd Flex
 * T(u, r)`, so the effector's local rotation is `rest^-1 T(u, -r) K` with `K`
 * fixed by the pose above and the request. The effector's rig twist is
 * `atan2(P, Q)` of two components of that rotation applied to its flexion
 * (and, for a distal effector, abduction) axis (`decomposeJointRotationOnBasis`),
 * and each component of a vector turned about `u` by `-r` is
 * `alpha + beta cos r + gamma sin r`. Asking the effector's twist to stand at
 * its clinical zero is therefore one equation `A + B cos r + C sin r = 0`,
 * solved in closed form: at most two forearm twists, the circle the hand
 * turns on as the forearm twists crossing the rotations the wrist's two
 * angles make. Of those inside the forearm's range, the range's two ends and
 * the start, the one whose effector, clamped to its own range, shows the
 * request most nearly is taken, and between equals the one nearest the
 * start: the current twist plus the swing-twist share (`swingTwist`) of the
 * change from the effector's current rotation to the requested one. So only
 * the residual beyond the current pose moves, a request near the current
 * hand rotation prefers a nearby forearm twist. The bounded candidate law is
 * retained; it does not globally minimize over both joints. Every candidate
 * is ranked through the same effector projection that final orientation uses.
 *
 * @param props The mid joint's and the effector's current clinical angles;
 *   `above`, the world rotation the mid joint's articulation composes after
 *   (its parent's world rotation and its rest); the mid and effector bases
 *   (normalized) and rest frames; the fixed lower-to-effector rotation,
 *   including unchanged intermediate bones and the effector rest; the requested
 *   effector world rotation; the skeleton whose ranges clamp; and, from a
 *   caller that solves many candidates, the two joints' clamps resolved once
 *   on that skeleton (`clampJointToSkeleton.of`) and optional shared effector
 *   projection prepared for those same axes, frame, domain and clamp. An
 *   optional effectorRestInverse must be Quaternion.inverse of that exact
 *   fixed rest frame; otherwise this solve computes it once for all trials.
 *   Optional articulation readers return this joint's raw composition, its
 *   rig-zero-twist composition and the actual held effector world-relative
 *   composition. They run at the original first-use sites; callers may share
 *   only unchanged joint/basis/frame inputs, never target-dependent answers.
 *   An optional composeLower belongs to this request on that same admitted
 *   lower basis/frame; it shares pure axis factors with the caller's immediate
 *   lower recomposition while still validating each joint and returning its
 *   fresh outer product; a private matching inner pair may also be shared.
 *   Optional preparedEffector borrows the fixed effector-frame readings from
 *   prepare under exactly the same rest, admitted basis and clinical frame.
 *   readHeldInverse may share Quaternion.inverse of the actual held raw
 *   quaternion. Its raw reader and angle/frame admission still run first,
 *   and the inverse callback runs only at the original inverse-use site.
 *   The target, preceding frame and admitted inputs stay unchanged throughout
 *   this synchronous solve, including while its pure readers/clamps run.
 * @returns The mid joint with its twist solved, clamped to the rig's range.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the effector cannot take, the equation its twist makes, how it is solved, which solution is taken and the start that breaks a tie.
 * @evidence contracts/development/implementation.md#principled-implementation Rodrigues' formula makes the clinical-zero twist condition a first-order trigonometric equation. Its at most two roots, range ends and reference are ranked by the actual rotation from prepareJointRotationProjection, the same effector owner final display uses; this finite outer law is not a global combined-joint optimizer.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One equation, its two solutions and one choice among a handful of candidates.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every lower twist is clamped to actual ROM, and every miss is read from actual projected articulation. The existing angular TIE policy chooses nearer starts among small differences; it is not a roundoff proof or a claim that the residual is zero. The chosen twist always owns its stored score.
 * @evidence contracts/development/implementation.md#efficient-algorithms Without caller-shared clamps/projector, setup performs O(B) rig lookups for B bones. At most five distinct clamped twists query the same prepared projector once each; an eligible query scores the reference plus at most eighteen pairs, at most nineteen actual joint recompositions or 95 across five queries. Unsupported queries retain the factory's four-sweep, forty-step-per-axis fallback, at most 528 recompositions each. The twist law's quaternion work remains additional constant work, and the existing TIE policy can stop after the start; runtime improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Matching source bases/clamps/inverses/projector and fixed effector readings are shared under unchanged dependencies. Optional raw/untwisted/held readers keep their original first-use order, and component-identical articulated/untwisted rotations share needed as K only after both reads. Within this solve, Object.is-identical requested twists reuse their completed pure lower clamp, preserving signed zero and actual joint coordinates. Exact-angle lower factors/inner pairs and fixed harmonic dot/cross terms share only pure arithmetic. Paired projection preserves the actual winning local demand/raw articulation before final normalization. No target answer crosses solves.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One solve retains at most eight requested-twist/clamped-joint rows (raw/clamped start, two extreme probes, two range ends and two roots), five candidate twists and constant harmonic/preparation data. Current/selected paired projections are bounded. All release at return/throw except the selected caller-owned result; borrowed source preparation remains its caller's, with no growing history, handles or tasks.
 */
export function solveDistalTwist(props: {
  joint: IAutoMovieJointPose;
  effector: IAutoMovieJointPose;
  above: IAutoMovieQuaternion;
  lowerBasis: IAutoMovieJointAxes;
  lowerFrame: IAutoMovieRestFrame | undefined;
  effectorRest: IAutoMovieQuaternion;
  effectorRestInverse?: IAutoMovieQuaternion;
  effectorBasis: IAutoMovieJointAxes;
  effectorFrame: IAutoMovieRestFrame | undefined;
  rotation: IAutoMovieQuaternion;
  skeleton: IAutoMovieSkeleton;
  clamps?: {
    lower: (joint: IAutoMovieJointPose) => IAutoMovieJointPose;
    effector: (joint: IAutoMovieJointPose) => IAutoMovieJointPose;
  };
  projectEffector?: (rotation: IAutoMovieQuaternion) => IAutoMovieJointPose;
  projectEffectorWithQuaternion?: (
    rotation: IAutoMovieQuaternion,
  ) => prepareJointRotationProjection.IProjection;
  readArticulated?: () => IAutoMovieQuaternion;
  readUntwisted?: () => IAutoMovieQuaternion;
  readHeldRotation?: () => IAutoMovieQuaternion;
  readHeldInverse?: (heldRaw: IAutoMovieQuaternion) => IAutoMovieQuaternion;
  composeLower?: ReturnType<typeof jointToQuaternionOnBasis.prepare>;
  preparedEffector?: solveDistalTwist.IPrepared;
}): IAutoMovieJointPose {
  return solve(props, false).joint;
}

/** Solve once, optionally retaining only the selected candidate's actual projection. */
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
    const preparedProject: prepareJointRotationProjection.IProjector = prepareJointRotationProjection({
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
    projectWithQuaternion = props.projectEffectorWithQuaternion ?? preparedProject.withQuaternion;
  } else {
    project = suppliedProject;
    projectWithQuaternion = props.projectEffectorWithQuaternion;
  }
  const readings: { twist: number; joint: IAutoMovieJointPose }[] = [];
  const at: (twist: number) => IAutoMovieJointPose = (
    twist: number,
  ): IAutoMovieJointPose => {
    for (const reading of readings)
      if (Object.is(reading.twist, twist)) return reading.joint;
    const joint: IAutoMovieJointPose = clampLower({ ...props.joint, twist });
    readings.push({ twist, joint });
    return joint;
  };
  const effectorRestInverse: IAutoMovieQuaternion =
    props.effectorRestInverse ?? Quaternion.inverse(props.effectorRest);
  let composeLower: ReturnType<typeof jointToQuaternionOnBasis.prepare> | undefined =
    props.composeLower;

  /** Keep exact axis factors only for this solve's changing lower joint. */
  const lowerRotation: ReturnType<typeof jointToQuaternionOnBasis.prepare> = (
    joint: Parameters<ReturnType<typeof jointToQuaternionOnBasis.prepare>>[0],
  ): IAutoMovieQuaternion => {
    composeLower ??= jointToQuaternionOnBasis.prepare(props.lowerBasis, props.lowerFrame);
    return composeLower(joint);
  };
  const effectorOf: (joint: IAutoMovieJointPose) => IAutoMovieQuaternion = (
    joint: IAutoMovieJointPose,
  ): IAutoMovieQuaternion => {
    // The same three coordinates on this fixed basis/frame compose the
    // original articulation, so its already completed needed rotation is exact.
    const unchanged: boolean = Object.is(joint.flexion, props.joint.flexion) &&
      Object.is(joint.abduction, props.joint.abduction) &&
      Object.is(joint.twist, props.joint.twist);
    const carried: IAutoMovieQuaternion = unchanged ? needed : Quaternion.multiply(
          Quaternion.inverse(
            Quaternion.multiply(
              props.above,
              lowerRotation(joint),
            ),
          ),
          props.rotation,
    );
    return Quaternion.normalize(Quaternion.multiply(effectorRestInverse, carried));
  };

  // How far the effector, clamped to its range, shows its asked rotation.
  let latestProjection: solveDistalTwist.IProjection | undefined;
  const missed: (twist: number) => number = (twist: number): number => {
    const local: IAutoMovieQuaternion = effectorOf(at(twist));
    const shown: IAutoMovieQuaternion = projectWithQuaternion === undefined
      ? jointToQuaternionOnBasis(project(local), props.effectorBasis, props.effectorFrame)
      : projectWithQuaternion(local).quaternion;
    if (paired) latestProjection = { local, quaternion: { ...shown } };
    return Quaternion.angle(Quaternion.normalize(shown), local);
  };

  // The start: the current twist plus the twist, about the mid bone's axis,
  // of the change from the effector's current rotation to the requested one.
  const articulated: IAutoMovieQuaternion = props.readArticulated?.() ?? lowerRotation(props.joint);
  const needed: IAutoMovieQuaternion = Quaternion.multiply(
    Quaternion.inverse(Quaternion.multiply(props.above, articulated)),
    props.rotation,
  );
  const held: IAutoMovieQuaternion = props.readHeldRotation?.() ?? Quaternion.multiply(
    props.effectorRest,
    jointToQuaternionOnBasis(
      props.effector,
      props.effectorBasis,
      props.effectorFrame,
    ),
  );
  const { twist }: ReturnType<typeof swingTwist> = swingTwist(
    Quaternion.normalize(Quaternion.multiply(
      needed, props.readHeldInverse?.(held) ?? Quaternion.inverse(held),
    )),
    props.lowerBasis.twist,
  );
  const start: number =
    at(
      decomposeJointRotationOnBasis(
        Quaternion.normalize(Quaternion.multiply(articulated, twist)),
        props.lowerBasis,
        props.lowerFrame,
      ).twist ?? 0,
    ).twist ?? 0;

  // K: the request seen from the mid bone's articulation before its twist.
  const untwisted: IAutoMovieQuaternion = props.readUntwisted?.() ?? lowerRotation(
    { ...props.joint, twist: toClinicalAngle(0, props.lowerFrame?.twist) },
  );
  // Both raw readers still ran. Equal components on this query's unchanged
  // above/request give the same original multiply-inverse-multiply result.
  const sameRawRotation: boolean = Object.is(articulated.x, untwisted.x) &&
    Object.is(articulated.y, untwisted.y) && Object.is(articulated.z, untwisted.z) &&
    Object.is(articulated.w, untwisted.w);
  const K: IAutoMovieQuaternion = sameRawRotation ? needed : Quaternion.multiply(
    Quaternion.inverse(Quaternion.multiply(props.above, untwisted)),
    props.rotation,
  );
  const u: IAutoMovieVector3 = props.lowerBasis.twist;
  const e: IAutoMovieJointAxes = props.effectorBasis;
  const fixed: solveDistalTwist.IPrepared = props.preparedEffector ?? solveDistalTwist.prepare({
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
    const along: number = normalProjection * (vectorProjection ??= Vector3.dot(u, x));
    const across: number = Vector3.dot(n, x) - along;
    vectorCross ??= Vector3.cross(u, x);
    return [
      along,
      across,
      -Vector3.dot(n, vectorCross),
    ];
  };
  const x: IAutoMovieVector3 = Quaternion.rotateVector(K, e.flexion);
  const [P, Q]: [number, number, number][] =
    e.twistPlacement === "distal"
      ? [harmonic(abduction, x), harmonic(abduction, Quaternion.rotateVector(K, e.abduction))]
      : [harmonic(abduction, x), harmonic(fixed.flexion(), x)];
  const { cosine, sine }: solveDistalTwist.IZero = fixed.zero();
  const [A, B, C]: number[] = [0, 1, 2].map(
    (i: number): number => P[i]! * cosine - Q[i]! * sine,
  );

  // The forearm's range, and the clinical twist of each solution inside it.
  const low: number = at(-1e6).twist ?? 0;
  const high: number = at(1e6).twist ?? 0;
  const candidates: number[] = [low, high, start];
  const radius: number = Math.hypot(B!, C!);
  if (radius > 1e-12 && Math.abs(A!) <= radius) {
    const centre: number = Math.atan2(C!, B!);
    const spread: number = Math.acos(Math.max(-1, Math.min(1, -A! / radius)));
    for (const r of [centre + spread, centre - spread]) {
      const clinical: number =
        toClinicalAngle((r * 180) / Math.PI, props.lowerFrame?.twist) ?? 0;
      // The alias of the solution nearest the range's middle.
      const middle: number = (low + high) / 2;
      candidates.push(clinical - 360 * Math.round((clinical - middle) / 360));
    }
  }

  // The candidate whose clamped effector misses least; between equals, the
  // nearest to the start.
  let chosen: number = start;
  let least: number = missed(start);
  let chosenProjection: solveDistalTwist.IProjection | undefined = latestProjection;

  // A start the effector shows within TIE can be neither beaten, since no
  // miss is below zero, nor tied by a twist nearer to itself.
  if (least <= TIE && at(start).twist === start)
    return { joint: at(start), projection: chosenProjection };

  // A candidate that clamps to a twist already read is the same pose: the
  // same miss, never strictly nearer, so it is not read again.
  const read: Set<number> = new Set([at(start).twist ?? 0]);
  for (const t of candidates) {
    const clamped: number = at(t).twist ?? 0;
    if (read.has(clamped)) continue;
    read.add(clamped);
    const m: number = missed(t);
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

/** Existing distal-candidate angular tie policy, radians; this is not a numerical-roundoff bound or a reached-target threshold. */
const TIE: number = 1e-6;

/** Internal joint-only and paired modes share one candidate search. */
interface ISolution {
  /** Selected actual clamped mid articulation. */
  joint: IAutoMovieJointPose;

  /** Retained only in paired mode, after at least the start was scored. */
  projection: solveDistalTwist.IProjection | undefined;
}

/**
 * Fixed effector readings for one unchanged twist-solving operation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the actual fixed lower-to-effector rotation, admitted basis and clinical frame, lazy original-use admission, borrowed derived readings and operation lifetime; target harmonics and candidates stay in each solve.
 * @evidence contracts/development/design.md#principled-representation Rotated effector axes and the handed clinical-zero twist sine/cosine depend only on the unchanged rest, basis and frame, while K and its P/Q projections depend on the request and remain outside this preparation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One prepared object supplies the actual two axis readers and zero-angle reader used by solveDistalTwist. Workspace and standalone solving share their mathematics without exposing candidate or target-history caches.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The factory captures only the three fixed rig references and performs no admission at construction. Each reading is first computed at its original solve site; a caller borrows it unchanged and drops the preparation when those dependencies or its operation end.
 */
export namespace solveDistalTwist {
  /**
   * A candidate's exact local demand and raw displayed effector articulation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the normalized demand and unnormalized selected articulation from one actual projection query.
   * @evidence contracts/development/design.md#principled-representation The two quaternion records describe one scored candidate under fixed basis, rest frame and projector dependencies; they preserve the normalization boundary used by final display.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Final hinged rotation scoring needs the demand to prove exact equivalence and the raw articulation to avoid repeating its completed projection.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No achieved point, angular score, approximate match or target-history key replaces the actual local rotation demand.
   */
  export interface IProjection {
    /** Normalized local target used by that candidate's actual projector query. */
    local: IAutoMovieQuaternion;

    /** Its selected raw articulation, before the score's normalization. */
    quaternion: IAutoMovieQuaternion;
  }

  /**
   * The selected lower joint paired with its completed effector projection.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the selected clamped joint and the actual winning-candidate projection, both owned by one result.
   * @evidence contracts/development/design.md#principled-representation The joint belongs to the same bounded search winner whose local projection is returned; final consumers still recompute the demand from that actual completed clamped joint.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The hinged rotation scorer consumes both members, while ordinary twist authoring keeps the joint-only entry.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The projection is mandatory because every paired solve scores at least its start; no optional mode or unscored candidate is exposed in this result.
   */
  export interface IResult {
    /** Selected clamped mid joint, with the ordinary entry's ownership. */
    joint: IAutoMovieJointPose;

    /** Actual selected-candidate projection, retained from the bounded search. */
    projection: IProjection;
  }

  /**
   * Run the identical bounded candidate law and also return the winning
   * candidate's completed local demand and raw effector projection. A
   * consumer may reuse that projection only for a component-identical
   * local demand under the same unchanged projector dependencies. The final
   * lower joint is the actual clamp and the consumer recomputes its demand;
   * an earlier score never substitutes a different requested rotation.
   *
   * One selected fixed-size reading survives the solve; at most the current
   * and selected readings are retained during it, with no target history.
   * Candidate count, score/tie order and every numerical projection in the
   * solve remain unchanged. Callers release the fresh result after composing
   * the actual displayed world rotation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States selected-candidate ownership, exact-local equivalence, actual completed lower clamp and caller release.
   * @evidence contracts/development/implementation.md#principled-implementation Returns the projection actually measured by the unchanged bounded distal-twist law; a consumer must compare its recomputed local demand exactly before reuse.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Both public entries delegate to one private search; only paired mode retains the selected projection beside its joint.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every candidate, tie and selected clamp remains actual, with no tolerance-based demand match or zero-error substitution.
   * @evidence contracts/development/implementation.md#efficient-algorithms Adds one fixed-size reading per actual query and one result; matching final consumers avoid another complete effector projection, with no measured speedup claim.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The winning candidate's raw projected articulation is completed work for its exact local target and fixed projection dependencies, rather than a cross-solve cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources At most current and selected projection readings remain reachable during solving; one selected reading escapes in the caller-owned result, with no global state or handles.
   */
  export function withProjection(
    props: Parameters<typeof solveDistalTwist>[0],
  ): IResult {
    const result: ISolution = solve(props, true);
    return { joint: result.joint, projection: result.projection! };
  }

  /** Fixed clinical-zero twist coefficients, borrowed unchanged by a solve. */
  export interface IZero {
    /** Cosine of the handed rest-relative clinical-zero twist, radians. */
    cosine: number;

    /** Sine of that same angle, evaluated after its cosine. */
    sine: number;
  }

  /** Lazy fixed-frame data; these readers never retain a target or lower joint. */
  export interface IPrepared {
    /** Effector abduction axis rotated by the actual fixed frame. */
    abduction(): IAutoMovieVector3;

    /** Effector flexion axis, needed only for the proximal Euler convention. */
    flexion(): IAutoMovieVector3;

    /** Handed clinical-zero twist, admitting that frame only when first read. */
    zero(): IZero;
  }

  /**
   * Borrow one operation's unchanged effector rest, admitted basis and clinical
   * frame. Construction admits no angle or unused frame. Each reader computes
   * its original expression once, where a solve first needs it, then lends the
   * derived record unchanged. Release the object with this operation; a new
   * rest, basis or clinical frame requires a new preparation.
   */
  export function prepare(
    props: Pick<Parameters<typeof solveDistalTwist>[0], "effectorRest" | "effectorBasis" | "effectorFrame">,
  ): IPrepared {
    const rest: IAutoMovieQuaternion = props.effectorRest;
    const basis: IAutoMovieJointAxes = props.effectorBasis;
    const frame: IAutoMovieRestFrame | undefined = props.effectorFrame;
    let abduction: IAutoMovieVector3 | undefined;
    let flexion: IAutoMovieVector3 | undefined;
    let zero: IZero | undefined;
    return {
      abduction: (): IAutoMovieVector3 => {
        abduction ??= Quaternion.rotateVector(rest, basis.abduction);
        return abduction;
      },
      flexion: (): IAutoMovieVector3 => {
        flexion ??= Quaternion.rotateVector(rest, basis.flexion);
        return flexion;
      },
      zero: (): IZero => {
        if (zero === undefined) {
          const handed: number =
            Vector3.dot(basis.twist, Vector3.cross(basis.flexion, basis.abduction)) >= 0 ? 1 : -1;
          const phi: number =
            (handed * (toRigAngle(0, frame?.twist) ?? 0) * Math.PI) / 180;
          zero = { cosine: Math.cos(phi), sine: Math.sin(phi) };
        }
        return zero;
      },
    };
  }
}
