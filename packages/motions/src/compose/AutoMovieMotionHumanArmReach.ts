import {
  Quaternion,
  ROM_TOLERANCE,
  Vector3,
  clampJointToSkeleton,
  fitHingedChainAt,
  getConstraint,
} from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieHumanLimbGoal,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMovieMotionHumanSequentialConvex,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanLimbAt } from "../posture/HumanLimbAt";
import { HumanSequentialConvex } from "../posture/HumanSequentialConvex";
import { HumanSequentialConvexFunctions } from "../posture/HumanSequentialConvexFunctions";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * A hand attitude a law asks up to a freedom it declares, read as the
 * equivalent the arm can take at its place, or refused.
 *
 * A law rarely needs one exact hand attitude: a card laid face up rests alike
 * at any heading about the vertical, a utensil's point aims along one axis
 * whatever its roll about it. That is the partial orientation constraint of
 * Tolani, Goswami and Badler 2000 (Graphical Models 62:353, section 3.3): the
 * goal leaves a turn psi of the attitude about one axis free, and the arm keeps
 * its swivel phi, so the arm has two free coordinates. Their section 3.3,
 * "Joint limits" (pp. 374-376), finds no usable parameterisation of the region
 * of (phi, psi) the joints' ranges admit and chooses the pair that minimises F
 * = sum over every joint angle but the elbow's hinge of (theta_i - theta_i*)^2,
 * theta_i* the middle of joint i's range, which keeps every joint as near the
 * middle of its range as it can be. Here theta_1 to theta_3 are the shoulder's
 * three angles and theta_5 to theta_7 the wrist's, read as one spherical joint
 * relative to the hinge-only forearm (`HumanLimbAt.free`): the hand's flexion
 * and abduction and the distal twist, which the rig takes in the forearm, so
 * the twist's range is the forearm's. Because the unconstrained minimum may
 * leave a joint past its range (section 3.3: the inverse kinematics is solved
 * "at the expense of possibly violating the joint limits"), the problem solved
 * is Table 3's (p. 379): F subject to every angle within its range, a
 * two-variable problem with nonlinear inequality constraints, solved by the
 * trajopt sequential convex optimiser (`HumanSequentialConvex`, a port of
 * `sco::BasicTrustRegionSQP`, Schulman et al. 2014), in radians so that sco's
 * parameters apply in its own units. Where the minimum is interior it is the
 * unconstrained one. The search starts at the swivel the arm's fit of the asked
 * attitude chooses from the law's elbow hint (sections 3.2.2 and 3.2.4: the
 * feasible swivel nearest the desired one) and at no turn, and keeps that fit's
 * bend branch. The angles at the solution are checked against the rig's own
 * ranges (`clampJointToSkeleton`, which also reads coupled limits) within the
 * range tolerance (`ROM_TOLERANCE`): met, the attitude turned by psi is taken;
 * otherwise the attitude is refused naming the joint, its axis and how far past
 * its range it goes, never clamped in silence. The choice is made once where
 * the law plans, never per read.
 */
export namespace AutoMovieMotionHumanArmReach {
  /**
   * What a law asks of the hand: its attitude, the axis it leaves the turn
   * about free, and where the wrist goes for a candidate attitude.
   */
  export interface IRequest {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The posture the arm is fitted on; its own goal for the arm is replaced. */
    posture: IAutoMovieMotionHumanPosture;

    /** The arm. */
    side: AutoMovieHumanSide;

    /** The elbow's hint, world metres. */
    bend: IAutoMovieVector3;

    /** The attitude the law asks, world. */
    requested: IAutoMovieQuaternion;

    /** The world axis the law leaves the turn about free, unit or not. */
    axis: IAutoMovieVector3;

    /**
     * The wrist's place for a candidate attitude, world metres (a held prop's
     * offset turns with the hand).
     */
    wrist: (rotation: IAutoMovieQuaternion) => IAutoMovieVector3;

    /** What the refusal names as the action's axis. */
    name: string;
  }

  /**
   * The attitude taken: the requested one turned about the free axis, and the
   * turn in degrees.
   */
  export interface IResult {
    /** The attitude, world. */
    rotation: IAutoMovieQuaternion;

    /** The turn about the free axis from the requested attitude, degrees. */
    turn: number;
  }

  /**
   * The reachable equivalent of a requested attitude, or a refusal.
   *
   * @param request What the law asks.
   * @returns The attitude whose arm keeps every joint nearest the middle of its
   *   range.
   * @throws {HumanRefusal} When a joint at that arm lies past its range by more
   *   than the range tolerance (`ROM_TOLERANCE`).
   */
  export function attitude(request: IRequest): IResult {
    const found: IResolved = resolve(request);
    if (found.past === null) return found.result;
    throw new HumanRefusal({
      kind: "reach",
      axis: request.name,
      value: found.past.degrees,
      feasible: {
        kind: "range",
        minimum: 0,
        maximum: ROM_TOLERANCE,
        unit: "degrees",
      },
      reason: `the ${request.side} arm nearest the middle of its joints' ranges with the asked hand attitude turned about its free axis (Tolani, Goswami and Badler 2000, section 3.3) takes the ${found.past.bone}'s ${found.past.axis} ${found.past.degrees.toFixed(1)} degrees past its range (turned ${found.result.turn.toFixed(1)} degrees)`,
      fix: "place the hand where the arm can take the attitude, or free more of the attitude",
    });
  }

  /**
   * The reachable equivalent of a requested attitude, or none: the same choice
   * as `attitude`, for a law that chooses the hand's place by whether its
   * attitude is met there.
   *
   * @param request What the law asks.
   * @returns The attitude, or null where a joint lies past its range.
   */
  export function met(request: IRequest): IResult | null {
    const found: IResolved = resolve(request);
    return found.past === null ? found.result : null;
  }

  /** Tolani's section 3.3 choice and its limit check. */
  function resolve(request: IRequest): IResolved {
    const limb: AutoMovieHumanLimb = `${request.side}Arm`;
    const axis: IAutoMovieVector3 = Vector3.normalize(request.axis);
    function turned(turn: number): IAutoMovieQuaternion {
      return Quaternion.normalize(
        Quaternion.multiply(
          Quaternion.fromAxisAngle(axis, turn),
          request.requested,
        ),
      );
    }
    function goal(turn: number): IAutoMovieHumanLimbGoal {
      const rotation: IAutoMovieQuaternion = turned(turn);
      return { point: request.wrist(rotation), rotation, bend: request.bend };
    }

    // The start: the arm's fit of the asked attitude, whose swivel is the
    // feasible one nearest the hint's (sections 3.2.2 and 3.2.4), and its
    // bend branch, which the search keeps.
    const fitted: IAutoMovieMotionHumanResolveHumanPosture.ISeeded =
      resolveHumanPosture.seeded(request.body, {
        ...request.posture,
        limbs: { ...request.posture.limbs, [limb]: goal(0) },
      });
    const seed: Seed = fitted.seeds[limb];
    if (seed === null || seed === undefined)
      throw new Error(
        `The ${limb} is not a hinged chain to choose a swivel on`,
      );

    // The angles at a swivel and turn, in the fit's frame (a left arm's in
    // its mirror image, so read against the right arm's ranges).
    const branch: number = seed.branch;
    function angles(x: readonly number[]): fitHingedChainAt.IFree {
      const free: fitHingedChainAt.IFree | null = HumanLimbAt.free(
        request.body,
        fitted.pose,
        limb,
        goal(x[1]!),
        x[0]!,
        branch,
      );
      if (free === null || free.effector === null)
        throw new Error(`The ${limb} has no wrist to turn`);
      return free;
    }
    const ranges: IRanges = rangesOf(request.body);

    // Table 3's problem (p. 379) in radians, the units trajopt's sco
    // parameters are stated in (its joints are radians), so they apply
    // unchanged: the variables are the swivel and the turn, F (section 3.3)
    // each angle's squared distance from the middle of its range, and one
    // vector constraint holding every angle within its range.
    function degrees(x: Vector): Vector {
      return [x[0]! / RADIAN, x[1]! / RADIAN];
    }
    function objective(x: Vector): number {
      let sum: number = 0;
      for (const [value, range] of terms(angles(degrees(x)), ranges))
        sum += ((value - (range.min + range.max) / 2) * RADIAN) ** 2;
      return sum;
    }
    function within(x: Vector): Vector {
      const out: number[] = [];
      for (const [value, range] of terms(angles(degrees(x)), ranges))
        out.push((range.min - value) * RADIAN, (value - range.max) * RADIAN);
      return out;
    }
    const solved: Solved = HumanSequentialConvex.minimise(
      HumanSequentialConvexFunctions.problem({
        costs: [{ f: objective, full: true }],
        constraints: [{ g: within, equality: false }],
        low: [-Infinity, -Infinity],
        high: [Infinity, Infinity],
      }),
      [seed.swivel * RADIAN, 0],
      HumanSequentialConvex.DEFAULTS,
    );
    const solution: Vector = degrees(solved.x);
    const turn: number = solution[1]!;
    return {
      result: { rotation: turned(turn), turn },
      past: beyond(request.body, angles(solution)),
    };
  }
}

/** Tolani's choice: the attitude and, where one lies past its range, the joint. */
interface IResolved {
  /** The attitude at the minimum. */
  result: AutoMovieMotionHumanArmReach.IResult;

  /** The joint farthest past its range there; null when every one is within. */
  past: IPast | null;
}

/** A joint's axis past its range. */
interface IPast {
  /** The bone, in the fit's frame. */
  bone: AutoMovieHumanoidBone;

  /** The axis. */
  axis: Axis;

  /** How far past its range, degrees. */
  degrees: number;
}

/** A joint's clinical axis. */
type Axis = "flexion" | "abduction" | "twist";

/** A limb's seed as a seeded resolve reports it: absent or null for none. */
type Seed =
  IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"][AutoMovieHumanLimb];

/** A free angle, degrees, as a joint pose holds it: absent or null is zero. */
type Angle = IAutoMovieJointPose["flexion"] | undefined;

/** An axis's range, as a constraint holds it: absent or null is immobile. */
type Range = IAutoMovieJointConstraint["flexion"] | undefined;

/** One term of F: a free angle, degrees, and its joint's range. */
type Term = readonly [number, IAutoMovieAngleRange];

/** The ranges F reads, in the fit's frame (the right arm's). */
interface IRanges {
  /** The shoulder's. */
  upper: IAutoMovieJointConstraint | null;

  /** The forearm's, whose twist the wrist's distal twist is read against. */
  lower: IAutoMovieJointConstraint | null;

  /** The hand's. */
  hand: IAutoMovieJointConstraint | null;
}

/** The fit's frame bones: a left arm is solved as its mirror image's right. */
const UPPER: AutoMovieHumanoidBone = "rightUpperArm";
const LOWER: AutoMovieHumanoidBone = "rightLowerArm";
const HAND: AutoMovieHumanoidBone = "rightHand";

/** The ranges of the arm's joints on a body, in the fit's frame. */
function rangesOf(body: IAutoMovieMotionHumanBody): IRanges {
  function of(bone: AutoMovieHumanoidBone): IAutoMovieJointConstraint | null {
    return getConstraint(bone, body.bones.get(bone)?.constraint ?? null);
  }
  return { upper: of(UPPER), lower: of(LOWER), hand: of(HAND) };
}

/**
 * F's terms (section 3.3): the shoulder's three angles, the hand's flexion and
 * abduction and the distal twist against the forearm's twist range; an axis
 * with no range (an immobile one) is no term.
 */
function terms(free: fitHingedChainAt.IFree, ranges: IRanges): Term[] {
  const out: Term[] = [];
  function add(value: Angle, range: Range): void {
    if (range !== null && range !== undefined) out.push([value ?? 0, range]);
  }
  add(free.upper.flexion, ranges.upper?.flexion);
  add(free.upper.abduction, ranges.upper?.abduction);
  add(free.upper.twist, ranges.upper?.twist);
  add(free.effector?.flexion, ranges.hand?.flexion);
  add(free.effector?.abduction, ranges.hand?.abduction);
  add(free.effector?.twist, ranges.lower?.twist);
  return out;
}

/**
 * The joint farthest past the rig's range at the free angles, by the rig's own
 * clamp (`clampJointToSkeleton`, which reads coupled limits too): the shoulder,
 * the forearm with the wrist's distal twist, and the hand without it; null when
 * every one is within the range tolerance.
 */
function beyond(
  body: IAutoMovieMotionHumanBody,
  free: fitHingedChainAt.IFree,
): IPast | null {
  const effector: IAutoMovieJointPose = free.effector!;
  const joints: readonly IAutoMovieJointPose[] = [
    { ...free.upper, bone: UPPER },
    { ...free.lower, bone: LOWER, twist: effector.twist ?? 0 },
    { ...effector, bone: HAND, twist: 0 },
  ];
  let worst: IPast | null = null;
  for (const joint of joints) {
    const clamped: IAutoMovieJointPose = clampJointToSkeleton.of(
      joint.bone,
      body.skeleton,
    )(joint);
    for (const axis of AXES) {
      const degrees: number = Math.abs(
        (joint[axis] ?? 0) - (clamped[axis] ?? 0),
      );
      if (
        degrees > ROM_TOLERANCE &&
        (worst === null || degrees > worst.degrees)
      )
        worst = { bone: joint.bone, axis, degrees };
    }
  }
  return worst;
}

/** Radians a degree: the problem is solved in radians (sco's units). */
const RADIAN: number = Math.PI / 180;

/** The problem's variables: the swivel and the turn. */
type Vector = HumanSequentialConvexFunctions.Vector;

/** The SQP's answer on the problem's variables. */
type Solved = IAutoMovieMotionHumanSequentialConvex.IResult<
  Vector,
  IAutoMovieMotionHumanSequentialConvex.IEvaluation
>;

/** A joint's three clinical axes. */
const AXES: readonly Axis[] = ["flexion", "abduction", "twist"];
