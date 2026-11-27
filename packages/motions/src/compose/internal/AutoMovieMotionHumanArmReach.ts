import {
  Quaternion,
  ROM_TOLERANCE,
  Vector3,
  AutoMovieEngineMotionKinematics,
} from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMovieMotionHumanSequentialConvex,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanLimbAt } from "../../posture/internal/HumanLimbAt";
import { HumanSequentialConvex } from "../../posture/internal/HumanSequentialConvex";
import { HumanSequentialConvexFunctions } from "../../posture/internal/HumanSequentialConvexFunctions";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { AutoMovieMotionHumanArmReachJoints } from "./AutoMovieMotionHumanArmReachJoints";

/*
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
 * the twist's range is the forearm's. The shoulder's and the wrist's angles
 * each have two families of solutions, the two Euler charts of one rotation
 * (`AutoMovieEngineMotionKinematics.fitHingedChainAtFree`'s `charts`), so, as
 * the paper does, four problems are solved, one for each combination, and the
 * least F among those meeting the limits is taken. The flow is the paper's own
 * (Tables 2 and 3, p. 379): a
 * reachable goal with partial orientation and the limits on is solved by F's
 * unconstrained minimum over the two variables ("only involves two variables
 * with no constraints", section 3.3), taken where it meets the limits; since
 * that minimum is found "at the expense of possibly violating the joint
 * limits", a goal whose minimum does not is solved as Table 3's, F subject to
 * every angle within its range, a two-variable problem with nonlinear
 * inequality constraints. Both are solved by the trajopt sequential convex
 * optimiser (`HumanSequentialConvex`, a port of `sco::BasicTrustRegionSQP`,
 * Schulman et al. 2014), in radians so that sco's parameters apply in its own
 * units. The search starts at the swivel the arm's fit of the asked attitude
 * chooses from the law's elbow hint (sections 3.2.2 and 3.2.4: the feasible
 * swivel nearest the desired one) and at no turn, and keeps that fit's bend
 * branch. The angles at the solution are checked against the rig's own ranges
 * (`clampJointToSkeleton`, which also reads coupled limits) within the range
 * tolerance (`ROM_TOLERANCE`): met, the attitude turned by psi is taken;
 * otherwise the attitude is refused naming the joint, its axis and how far past
 * its range it goes, never clamped in silence. The choice is made once where
 * the law plans, never per read.
 */
export namespace AutoMovieMotionHumanArmReach {
  /*
   * What a law asks of the hand: its attitude, the axis it leaves the turn
   * about free, and where the wrist goes for a candidate attitude.
   */
  export interface IRequest {
    /*
     * The body.
     */
    body: IAutoMovieMotionHumanBody;

    /*
     * The posture the arm is fitted on; its own goal for the arm is replaced.
     */
    posture: IAutoMovieMotionHumanPosture;

    /*
     * The arm.
     */
    side: AutoMovieHumanSide;

    /*
     * The elbow's hint, world metres.
     */
    bend: IAutoMovieVector3;

    /*
     * The attitude the law asks, world.
     */
    requested: IAutoMovieQuaternion;

    /*
     * The world axis the law leaves the turn about free, unit or not.
     */
    axis: IAutoMovieVector3;

    /*
     * The wrist's place for a candidate attitude, world metres (a held prop's
     * offset turns with the hand).
     */
    wrist: (rotation: IAutoMovieQuaternion) => IAutoMovieVector3;

    /*
     * What the refusal names as the action's axis.
     */
    name: string;
  }

  /*
   * The attitude taken: the requested one turned about the free axis, and the
   * turn in degrees.
   */
  export interface IResult {
    /*
     * The attitude, world.
     */
    rotation: IAutoMovieQuaternion;

    /*
     * The turn about the free axis from the requested attitude, degrees.
     */
    turn: number;
  }

  /*
   * The reachable equivalent of a requested attitude, or a refusal.
   * Parameter request: What the law asks.
   * Returns: The attitude whose arm keeps every joint nearest the middle of its
   * range.
   * When a joint at that arm lies past its range by more
   * than the range tolerance (`ROM_TOLERANCE`).
   */
  export function attitude(request: IRequest): IResult {
    const found: IResolved = resolve(request);
    if (found.past === null) return found.result;
    throw new AutoMovieMotionHumanRefusal({
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

  /*
   * The reachable equivalent of a requested attitude, or none: the same choice
   * as `attitude`, for a law that chooses the hand's place by whether its
   * attitude is met there.
   * Parameter request: What the law asks.
   * Returns: The attitude, or null where a joint lies past its range.
   */
  export function met(request: IRequest): IResult | null {
    const found: IResolved = resolve(request);
    return found.past === null ? found.result : null;
  }

  /*
   * Tolani's section 3.3 choice and its limit check.
   */
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
    // its mirror image, so read against the right arm's ranges), on one of
    // the four combinations of the root's and the wrist's two families of
    // solutions (section 3.3), each angle read at its full-turn alias nearest
    // its range, as the rig reads a chart (`nearestAngleAlias`).
    const branch: number = seed.branch;
    const ranges: AutoMovieMotionHumanArmReachJoints.IRanges =
      AutoMovieMotionHumanArmReachJoints.rangesOf(request.body);
    function angles(
      x: readonly number[],
      family: IFamily,
    ): AutoMovieMotionHumanArmReachJoints.IFreeAngles {
      const free: AutoMovieEngineMotionKinematics.IHingedChainFreeFit | null =
        HumanLimbAt.free(
          request.body,
          fitted.pose,
          limb,
          goal(x[1]!),
          x[0]!,
          branch,
        );
      if (free === null || free.charts.effector === null)
        throw new Error(`The ${limb} has no wrist to turn`);
      return {
        upper: AutoMovieMotionHumanArmReachJoints.aliased(
          free.charts.upper[family.upper],
          ranges.upper,
        ),
        lower: free.lower,
        effector: AutoMovieMotionHumanArmReachJoints.aliased(
          free.charts.effector[family.effector],
          {
            flexion: ranges.hand?.flexion ?? null,
            abduction: ranges.hand?.abduction ?? null,
            twist: ranges.lower?.twist ?? null,
          },
        ),
      };
    }

    // Table 2's and Table 3's problems (p. 379) in radians, the units
    // trajopt's sco parameters are stated in (its joints are radians), so
    // they apply unchanged: the variables are the swivel and the turn, F
    // (section 3.3) each angle's squared distance from the middle of its
    // range, and, for Table 3, one vector constraint holding every angle
    // within its range: each joint axis's displacement by the rig's own
    // clamp (`clampJointToSkeleton`, coupled limits included), the very
    // limits the solution is checked against.
    const clamps: AutoMovieMotionHumanArmReachJoints.IClamps =
      AutoMovieMotionHumanArmReachJoints.clampsOf(request.body);
    const start: Vector = [seed.swivel * RADIAN, 0];
    function degrees(x: Vector): Vector {
      return [x[0]! / RADIAN, x[1]! / RADIAN];
    }
    function minimum(family: IFamily, limited: boolean): ICandidate {
      function objective(x: Vector): number {
        let sum: number = 0;
        for (const [value, range] of AutoMovieMotionHumanArmReachJoints.terms(
          angles(degrees(x), family),
          ranges,
        ))
          sum += ((value - (range.min + range.max) / 2) * RADIAN) ** 2;
        return sum;
      }
      function within(x: Vector): Vector {
        return AutoMovieMotionHumanArmReachJoints.displaced(
          angles(degrees(x), family),
          clamps,
        ).map(
          (d: AutoMovieMotionHumanArmReachJoints.IDisplaced): number =>
            d.degrees * RADIAN,
        );
      }
      const solved: Solved = HumanSequentialConvex.minimise(
        HumanSequentialConvexFunctions.problem({
          costs: [{ f: objective, full: true }],
          constraints: limited ? [{ g: within, equality: false }] : [],
          low: [-Infinity, -Infinity],
          high: [Infinity, Infinity],
        }),
        start,
        HumanSequentialConvex.DEFAULTS,
      );
      const solution: Vector = degrees(solved.x);
      const turn: number = solution[1]!;
      return {
        result: { rotation: turned(turn), turn },
        past: AutoMovieMotionHumanArmReachJoints.beyond(
          request.side,
          AutoMovieMotionHumanArmReachJoints.displaced(
            angles(solution, family),
            clamps,
          ),
        ),
        f: objective(solved.x),
      };
    }

    // Section 3.3: "there are two different families of solutions for
    // theta_1 and theta_5, ... four optimization problems that must be
    // solved, one for each combination of the two families". Table 2 (p.
    // 379), a reachable goal with the limits on: F's unconstrained minimum
    // ("two variables with no constraints"), the least F of the four that
    // meets the limits; Table 3, the goal unsolvable so, only where none
    // does: F under the limits as constraints, again the least of the four
    // that meets them; else the one least past its range, refused.
    const unconstrained: ICandidate[] = FAMILIES.map(
      (family: IFamily): ICandidate => minimum(family, false),
    );
    const free: ICandidate | null = least(unconstrained);
    if (free !== null) return free;
    const limited: ICandidate[] = FAMILIES.map(
      (family: IFamily): ICandidate => minimum(family, true),
    );
    return (
      least(limited) ??
      limited.reduce(
        (a: ICandidate, b: ICandidate): ICandidate =>
          b.past!.degrees < a.past!.degrees ? b : a,
      )
    );
  }
}

/*
 * One combination of the root's and the wrist's families of solutions.
 */
interface IFamily {
  /*
   * The root's chart: 0 the principal, 1 the alternate.
   */
  upper: 0 | 1;

  /*
   * The wrist's chart: 0 the principal, 1 the alternate.
   */
  effector: 0 | 1;
}

/*
 * The four combinations of the two joints' two families (section 3.3).
 */
const FAMILIES: readonly IFamily[] = [
  { upper: 0, effector: 0 },
  { upper: 0, effector: 1 },
  { upper: 1, effector: 0 },
  { upper: 1, effector: 1 },
];

/*
 * One family's solution: the choice, its limit check and its F.
 */
interface ICandidate extends IResolved {
  /*
   * F at the solution, radians squared.
   */
  f: number;
}

/*
 * The candidate of least F that meets the limits; null when none does.
 */
function least(candidates: readonly ICandidate[]): ICandidate | null {
  let found: ICandidate | null = null;
  for (const c of candidates)
    if (c.past === null && (found === null || c.f < found.f)) found = c;
  return found;
}

/*
 * Tolani's choice: the attitude and, where one lies past its range, the joint.
 */
interface IResolved {
  /*
   * The attitude at the minimum.
   */
  result: AutoMovieMotionHumanArmReach.IResult;

  /*
   * The joint farthest past its range there; null when every one is within.
   */
  past: AutoMovieMotionHumanArmReachJoints.IPast | null;
}

/*
 * A limb's seed as a seeded resolve reports it: absent or null for none.
 */
type Seed =
  IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"][AutoMovieHumanLimb];

/*
 * Radians a degree: the problem is solved in radians (sco's units).
 */
const RADIAN: number = Math.PI / 180;

/*
 * The problem's variables: the swivel and the turn.
 */
type Vector = HumanSequentialConvexFunctions.Vector;

/*
 * The SQP's answer on the problem's variables.
 */
type Solved = IAutoMovieMotionHumanSequentialConvex.IResult<
  Vector,
  IAutoMovieMotionHumanSequentialConvex.IEvaluation
>;
