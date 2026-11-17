import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmTrajectoryEvaluate } from "./HumanArmTrajectoryEvaluate";
import { HumanArmTrajectoryInvalid } from "./HumanArmTrajectoryInvalid";
import type { HumanArmTrajectoryPairs as P } from "./HumanArmTrajectoryPairs";
import type { HumanArmTrajectorySweep } from "./HumanArmTrajectorySweep";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";
import type { IHumanPosture } from "./IHumanPosture";

/**
 * The objective and the constraints of an arms' trajectory
 * (`HumanArmTrajectory`), evaluated at an iterate; its context is built by
 * `HumanArmTrajectoryContext` and its convex model by
 * `HumanArmTrajectoryConvex`, both on the terms of
 * `HumanArmTrajectoryTerms`.
 *
 * Objective: each arm's squared coordinate accelerations; its elbow's and
 * wrist's squared Cartesian steps, CHOMP's arc length (Zucker et al. 2013,
 * IJRR 32:1164), so the workspace travel is short; and on the hold the
 * hand's squared distance and rotation off its site, the rotation giving way
 * where the arm's range cannot meet it (`IHumanPosture.IGoal.contact`).
 *
 * Constraints, met by TrajOpt's exact l1 penalty: on the hold the hand's
 * contact on its site's disc and each declared effector point within its
 * physical displacement bound; every collider probe of the arm (the tangle
 * audit's corners) no deeper in any shape than its allowance at every
 * waypoint, and the arm's axis spheres swept between two waypoints no
 * deeper (the sphere's motion is a capsule, TrajOpt's continuous check);
 * two arms' probes as clear of each other; the elbow's, wrist's and
 * fingertips' speed within the audit's travel bound; and, hard, the joints'
 * ranges. The hand's contact is a unilateral contact on its site: its place
 * along the surface is within the disc and drawn to the site, its height
 * along the touched collider's outward normal is no lower than the site's,
 * and the lift is minimised, so the hand stands off by the least that keeps
 * its own colliders out of the touched segment.
 */
export namespace HumanArmTrajectoryModel {
  /** The hand on its site at a hold waypoint. */
  export interface ISite {
    /** The world point the contact is put at. */
    point: IAutoMovieVector3;
    /** The contact in the hand's rest frame from the wrist. */
    contact: IAutoMovieVector3;
    /** The hand's world rotation on the site; free when absent. */
    rotation?: IAutoMovieQuaternion;
    /** The effector's hard point-displacement limits, in the same local frame as contact. */
    limits?: IHumanPosture.IGoal["limits"];
    /** The radius of the region's disc about the point the contact may land in, metres. */
    disc: number;
    /**
     * The segment of another arm of the problem the site rides on, which that
     * arm moves as it is solved: the site's point, normal and rotation are
     * then that segment's own (`point` and `rotation` above where the base
     * holds it). A site of the body or another body rides nothing.
     */
    on?: {
      /** The other arm's index in the problem. */
      arm: number;
      /** Its segment. */
      owner: "upper" | "lower" | "hand";
      /** The point in the segment's frame. */
      point: IAutoMovieVector3;
      /** The touched collider's outward normal there, in the segment's frame; none for a grip on an object both hands hold, a closed chain whose contact is held to the point on every axis. */
      normal?: IAutoMovieVector3;
      /** The hand's rotation in the segment's frame. */
      rotation?: IAutoMovieQuaternion;
    };
  }

  /** One of an arm's three segments. */
  export type Segment = "upperArm" | "lowerArm" | "hand";

  /** A declared rest of one of the arm's segments on a bone of the same body over the hold (a self-hug's forearm on the other forearm or the chest). */
  export interface IRest {
    /** The arm's segment. */
    part: "upperArm" | "lowerArm";
    /** The bone it lies on. */
    on: string;
  }

  /** The largest violation of a constraint other than clearance accepted as feasible: a millimetre, or a millimetre per step; the solve refuses past it. */
  export const TOLERANCE: number = T.TOLERANCE;

  /** The audit's bound on a point's travel, 80 mm per twenty-fourth of a second, metres per second: a bound against a step, not a human norm (a daily reach peaks near 0.55 m/s, J NeuroEng Rehabil 2006 3:18). */
  export const SPEED_LIMIT: number = 0.08 * 24;

  /**
   * The travel a speed-bounded probe may make over an interval, millimetres:
   * the audit's bound over it less the tolerance a violation is accepted
   * within. The audit reads its bound with no tolerance, so a step the model
   * accepts at its own tolerance must still lie within the audit's bound; a
   * step bounded at the audit's own figure and accepted a millimetre past it
   * would not (measured: 33.0 mm in a sixtieth of a second against 32).
   *
   * @param dt The interval, seconds.
   * @returns The bound, millimetres.
   */
  export function stepLimit(dt: number): number {
    return 1000 * SPEED_LIMIT * dt - TOLERANCE;
  }

  /** What a solve reads, built once (`HumanArmTrajectoryContext.of`). */
  export interface IContext {
    /** The number of waypoints. */
    n: number;
    /** Whether the problem is a still configuration, read without its steps, speeds and sweeps and smoothed only among its inner waypoints. */
    still: boolean;
    /** Whether the last waypoint is a variable: every arm holds its site there, a hold that lasts to the end with nothing to return to; otherwise the last waypoint is the arm it returns to (`back`). */
    open: boolean;
    /** Each arm's coordinates a still configuration is drawn to, the squared distance from them weighed by `HumanArmTrajectoryTerms.ANCHOR` in the objective; none for an arm left free, and none for a trajectory. */
    anchor?: readonly (readonly number[] | undefined)[];
    /** The waypoints' seconds. */
    times: readonly number[];
    /** Each arm's setup. */
    setups: G.ISetup[];
    /** Each arm's frame at each waypoint. */
    frames: G.IFrame[][];
    /** Each arm's site at each waypoint, on the hold. */
    sites: (ISite | undefined)[][];
    /** Each arm's coordinates at the first waypoint. */
    rest: number[][];
    /** Each arm's coordinates at the last waypoint, where it is not a variable (`open`); the bound of the chart's disc either way. */
    back: number[][];
    /** Each arm's free coordinates, the variables. */
    free: number[][];
    /** Each arm's first variable within a waypoint's. */
    offset: number[];
    /** The variables per waypoint, every arm's. */
    width: number;
    /** Each arm's coordinates' hard bounds; none for the chart's two. */
    bounds: ([number, number] | null)[][];
    /** The depth a probe may keep against a shape at a waypoint, metres (negative inside). */
    allowed: (a: number, k: number, probe: number, shape: number) => number;
    /** The same between a probe of one arm and a collider of the other (`S.colliders`), the collider's bone for a declared rest. */
    between: (
      a: number,
      k: number,
      probe: number,
      shape: number,
      bone: string,
    ) => number;
    /** Whether a segment of one arm and a segment of the other hold one object together at a waypoint: each segment in its arm's declared grasp, over the action, as the hands close on the object, hold it and part from it. Such a pair is the allowed-collision set of the shared grasp (as a motion planner's allowed-collision matrix excuses the links that grasp an object through its approach and retreat); clearance against the body stays. */
    grasped: (a: number, k: number, own: Segment, other: Segment) => boolean;
    /** The depth a body corner (`G.IFrame.body`) may keep inside one of the arm's own collider shapes (`S.colliders`, by index) at a waypoint, metres (negative inside): the reverse of `allowed`, as the audit reads every pair both ways. */
    inside: (a: number, k: number, corner: number, shape: number) => number;
    /** Whether an arm's segment lies on a bone at a waypoint, a declared rest (`IRest`). */
    lying: (
      a: number,
      k: number,
      segment: "upperArm" | "lowerArm" | "hand",
      bone: string,
    ) => boolean;
    /** Each site's outward normal, the touched collider's at the site's point. */
    normals: (IAutoMovieVector3 | undefined)[][];
    /** Whether a probe's pair with a bone is a declared rest at a waypoint (`IRest`), read both ways. */
    rested: (a: number, k: number, probe: number, bone: string) => boolean;
    /** Each site's touched collider, the shape nearest its point; -1 where none. */
    touched: number[][];
    /** Each arm's frame's shapes any placement of the arm can come within the pairs' reach of, at each waypoint, ascending (`HumanArmShapes.reachable`): the only shapes a sphere screen reads there. */
    reachable: readonly (readonly number[])[][];
  }

  /** An iterate's reading. */
  export interface IEvaluation {
    /** Each arm placed at each waypoint. */
    placed: G.IPlaced[][];
    /** The objective. */
    objective: number;
    /** The constraints' violations summed, millimetres. */
    violation: number;
    /** The worst violation past its slack, what it is, the refusal's axis, the waypoint it is read at (an interval's first, for a step or a sweep) and the term it breaks: `speed`, `swept`, `site`, `lift`, `limit`, `probe`, `embedded` or `crossing`, empty when none does. */
    worst: { value: number; what: string; axis: string; at: number; term: string };
    /** Each arm's deepest probe pairs (`HumanArmTrajectoryPairs.deepest`) and the body's corners in it (`embedded`) at each inner waypoint, as the reading found them, which the convex model reads again at the same iterate. */
    pairs: {
      deepest: Map<number, P.IPair>;
      embedded: Map<number, P.IEmbedded>;
    }[][];
    /** Each arm's axis spheres' sweeps over each interval, by its first waypoint (`HumanArmTrajectorySweep.of`), as the reading found them; none for a still configuration. */
    swept: HumanArmTrajectorySweep.ISwept[][][];
    /** The two arms' pairs with each other at each inner waypoint (`HumanArmTrajectoryPairs.crossing`, read to `CUT`), as the reading found them; no entry at a waypoint that is not solved for, and none for one arm. */
    crossing: Map<string, P.ICrossing>[];
  }

  /**
   * Whether a waypoint's coordinates are variables: every waypoint but the
   * first, where the arm leaves its rest, and the last, where it returns,
   * unless the hold lasts to the end (`IContext.open`).
   *
   * @param c The context.
   * @param k The waypoint.
   * @returns Whether the waypoint is solved for.
   */
  export function inner(c: Pick<IContext, "n" | "open">, k: number): boolean {
    return k > 0 && (k < c.n - 1 || (c.open && k === c.n - 1));
  }

  /**
   * The iterate after a step of the convex subproblem: each inner
   * waypoint's free coordinates moved by the step, the others kept, then
   * projected onto the hard ranges (`ranged`), which the subproblem meets
   * only to its linearisation and its solver's tolerance.
   *
   * @param c The context.
   * @param x Each arm's coordinates at each waypoint.
   * @param step The subproblem's solution, by waypoint and then arm.
   * @returns The new iterate.
   */
  export function stepped(
    c: IContext,
    x: readonly (readonly number[])[][],
    step: Float64Array,
  ): number[][][] {
    return x.map((arm: readonly (readonly number[])[], a: number): number[][] =>
      arm.map((v: readonly number[], k: number): number[] => {
        const out: number[] = [...v];
        if (!inner(c, k)) return out;
        c.free[a]!.forEach((d: number, f: number): void => {
          out[d] = out[d]! + step[(k - 1) * c.width + c.offset[a]! + f]!;
        });
        return ranged(c, a, out);
      }),
    );
  }

  /**
   * An arm's coordinates projected onto its hard ranges, the nearest point
   * of that convex set (a projected step, Bertsekas 1976, "On the
   * Goldstein-Levitin-Polyak gradient projection method", IEEE TAC 21:174):
   * the chart's swing brought back to the disc `invalid` reads, along its
   * radius, and each boxed coordinate clamped to its bounds. Coordinates in
   * range are returned as they are, so the one reading `invalid` refuses by
   * holds on every iterate.
   *
   * @param c The context.
   * @param a The arm.
   * @param v The coordinates.
   * @returns The coordinates in range.
   */
  export function ranged(
    c: IContext,
    a: number,
    v: readonly number[],
  ): number[] {
    const out: number[] = [...v];
    const xy: number = Math.hypot(out[0]!, out[1]!);
    const disc: number = swing(c, a);
    if (xy > disc) {
      out[0] = (out[0]! * disc) / xy;
      out[1] = (out[1]! * disc) / xy;
    }
    c.free[a]!.forEach((d: number): void => {
      const b: [number, number] | null | undefined = c.bounds[a]![d];
      if (b !== null && b !== undefined)
        out[d] = Math.min(b[1], Math.max(b[0], out[d]!));
    });
    return out;
  }

  /** The chart radius owned by HumanArmTrajectoryInvalid.swing. */
  export const swing: typeof HumanArmTrajectoryInvalid.swing =
    HumanArmTrajectoryInvalid.swing;

  /**
   * The objective and the constraints' violations at an iterate, read in
   * full or, given an earlier reading and the waypoints changed since it, at
   * those waypoints only (`HumanArmTrajectoryEvaluate`, which owns the
   * reading).
   *
   * @param c The context.
   * @param x Each arm's coordinates at each waypoint.
   * @param kept An earlier reading of this context and the waypoints whose coordinates changed since it; absent, every waypoint is read.
   * @returns The arms placed, the objective, the summed violation and the worst one past its slack.
   */
  export function evaluate(
    c: IContext,
    x: readonly (readonly number[])[][],
    kept?: { reading: IEvaluation; laid: readonly boolean[] },
  ): IEvaluation {
    return HumanArmTrajectoryEvaluate(c, x, kept);
  }

  /** Configuration validity owned by HumanArmTrajectoryInvalid.of. */
  export const invalid: typeof HumanArmTrajectoryInvalid.of =
    HumanArmTrajectoryInvalid.of;
}
