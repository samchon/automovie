import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmTrajectoryInvalid } from "./HumanArmTrajectoryInvalid";
import { HumanArmTrajectoryLimits as L } from "./HumanArmTrajectoryLimits";
import { HumanArmTrajectoryPairs as P } from "./HumanArmTrajectoryPairs";
import { HumanArmTrajectorySweep } from "./HumanArmTrajectorySweep";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";
import { HumanArmTrajectoryTravel as V } from "./HumanArmTrajectoryTravel";

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
 * where the arm's range cannot meet it (`HumanPosture.IGoal.contact`).
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
    limits?: IAutoMovieHumanLimbGoal["limits"];
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
    setups: IAutoMovieMotionHumanArmGeometry.ISetup[];
    /** Each arm's frame at each waypoint. */
    frames: IAutoMovieMotionHumanArmGeometry.IFrame[][];
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
    placed: IAutoMovieMotionHumanArmGeometry.IPlaced[][];
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
   * The objective and the constraints' violations at an iterate.
   *
   * @param c The context.
   * @param x Each arm's coordinates at each waypoint.
   * @returns The arms placed, the objective, the summed violation and the worst one past its slack.
   */
  export function evaluate(
    c: IContext,
    x: readonly (readonly number[])[][],
  ): IEvaluation {
    const placed: IAutoMovieMotionHumanArmGeometry.IPlaced[][] = x.map(
      (
        arm: readonly (readonly number[])[],
        a: number,
      ): IAutoMovieMotionHumanArmGeometry.IPlaced[] =>
        arm.map(
          (
            v: readonly number[],
            k: number,
          ): IAutoMovieMotionHumanArmGeometry.IPlaced =>
            G.placed(c.setups[a]!, c.frames[a]![k]!, v),
        ),
    );
    let objective: number = 0;
    let violation: number = 0;
    let worst: IEvaluation["worst"] = {
      value: 0,
      what: "",
      axis: "region",
      at: 0,
      term: "",
    };
    // A clearance miss refuses only past the audit's own skin, the margin
    // the allowance keeps below it aside (`HumanArmTrajectoryTerms.SKIN`).
    // The waypoint the loop below reads, where a violation noted is placed.
    let here: number = 0;
    const pairs: IEvaluation["pairs"] = x.map(
      (): IEvaluation["pairs"][number] => [],
    );
    const swept: IEvaluation["swept"] = x.map(
      (): IEvaluation["swept"][number] => [],
    );
    const crossing: IEvaluation["crossing"] = [];
    // A term's refusal axis: a speed asks for time, a task point names its
    // target, every other term the region.
    const note = (
      v: number,
      term: "speed" | "swept" | "site" | "lift" | "limit" | "probe" | "embedded" | "crossing",
      what: () => string,
      slack: number = 0,
    ): void => {
      if (v <= 0) return;
      violation += v;
      if (v - slack > worst.value) worst = { value: v - slack, what: what(), at: here, term,
        axis: term === "speed" ? "duration" : term === "limit" ? "target" : "region" };
    };
    const n: number = c.n;
    const times: readonly number[] = c.times;
    x.forEach((arm: readonly (readonly number[])[], a: number): void => {
      // A still configuration's waypoints are smoothed among themselves
      // only: its ends are not part of it.
      for (let k: number = c.still ? 2 : 0; k < (c.still ? n - 2 : n); ++k)
        for (const d of c.free[a]!) {
          const acc: number =
            arm[Math.min(n - 1, k + 1)]![d]! -
            2 * arm[k]![d]! +
            arm[Math.max(0, k - 1)]![d]!;
          objective += T.ACCELERATION * acc * acc;
        }
      // A still configuration drawn to its anchor.
      const anchor: readonly number[] | undefined = c.anchor?.[a];
      if (anchor !== undefined)
        for (let k: number = 1; k + 1 < n; ++k)
          for (const d of c.free[a]!) {
            const off: number = arm[k]![d]! - anchor[d]!;
            objective += T.ANCHOR * off * off;
          }
      for (let k: number = 0; k + 1 < n; ++k) {
        here = k;
        // A probe's travel is read against the arm's own base, so a carried
        // body's travel is never charged to the arm (`HumanArmTrajectoryTravel`).
        const travel = (p: number): number =>
          1000 *
          Vector3.length(
            V.step(
              c.frames[a]![k]!,
              c.frames[a]![k + 1]!,
              placed[a]![k]!.probes[p]![0],
              placed[a]![k + 1]!.probes[p]![0],
            ),
          );
        for (const p of c.still ? [] : T.PATH) {
          const s: number = travel(p);
          objective += T.LENGTH * s * s;
        }
        const dt: number = times[k + 1]! - times[k]!;
        for (const p of c.still ? [] : T.SPEED) {
          const step: number = travel(p);
          note(
            step - stepLimit(dt),
            "speed",
            () =>
              `probe ${p} moves ${(step / dt / 1000).toFixed(2)} m/s at ${times[k]!.toFixed(3)} s`,
          );
        }
        const sweeps: HumanArmTrajectorySweep.ISwept[] = c.still
          ? []
          : HumanArmTrajectorySweep.of(c, a, k, placed[a]![k]!, placed[a]![k + 1]!);
        swept[a]![k] = sweeps;
        for (const sweep of sweeps) {
          const short: number = 1000 * (sweep.lower - sweep.clear);
          note(
            short,
            "swept",
            () =>
              `probe ${sweep.probe} swept ${short.toFixed(1)} mm inside shape ${sweep.shape} after ${times[k]!.toFixed(3)} s`,
          );
        }
      }
      for (let k: number = 1; k < n; ++k) {
        if (!inner(c, k)) continue;
        here = k;
        const site: ISite | undefined = c.sites[a]![k];
        if (site !== undefined) {
          const at: P.ILocated = P.located(c, placed, a, k, site);
          const contact: IAutoMovieVector3 = P.pad(
            placed[a]![k]!,
            site.contact,
          );
          const off: IAutoMovieVector3 = Vector3.scale(
            Vector3.subtract(contact, at.point),
            1000,
          );
          const normal: IAutoMovieVector3 | undefined = at.normal;
          const across: number =
            normal === undefined ? 0 : Vector3.dot(off, normal);
          const slide: number = Vector3.length(
            normal === undefined
              ? off
              : Vector3.subtract(off, Vector3.scale(normal, across)),
          );
          // The contact's height above the touched collider, less the site's
          // own: the site's standing off the surface is kept where the region
          // curves away from its plane.
          const lift: number =
            normal === undefined || at.shape === undefined
              ? 0
              : 1000 * (at.gap(contact) - at.gap(at.point));
          note(
            slide - 1000 * site.disc,
            "site",
            () =>
              `the hand ${slide.toFixed(1)} mm off its site along the surface at ${times[k]!.toFixed(3)} s, beyond the region's ${(1000 * site.disc).toFixed(0)} mm`,
          );
          objective += T.SITE * slide * slide;
          note(
            -lift,
            "lift",
            () =>
              `the hand ${(-lift).toFixed(1)} mm inside its site at ${times[k]!.toFixed(3)} s`,
          );
          objective += T.LIFT * lift * lift;
          for (const limit of L.of(site, at, placed[a]![k]!))
            note(
              limit.distance - limit.allowance,
              "limit",
              () =>
                `a task point ${limit.distance.toFixed(1)} mm off its asked place at ${times[k]!.toFixed(3)} s`,
            );
          if (site.rotation !== undefined) {
            const turned: number = P.angle(
              at.rotation ?? site.rotation,
              placed[a]![k]!.hand,
            );
            objective += T.ROTATION * turned * turned;
          }
        }
        // Only the pairs the merit and the convex model can use are read
        // exactly (`HumanArmTrajectoryPairs.CUT`).
        const deepest: Map<number, P.IPair> = P.deepest(
          c,
          a,
          k,
          placed[a]![k]!,
          P.CUT,
        );
        const embedded: Map<number, P.IEmbedded> = P.embedded(
          c,
          a,
          k,
          placed[a]![k]!,
          P.CUT,
        );
        pairs[a]![k] = { deepest, embedded };
        for (const pair of deepest.values()) {
          note(
            pair.short,
            "probe",
            () =>
              `probe ${pair.probe} ${pair.short.toFixed(1)} mm inside shape ${pair.shape} at ${times[k]!.toFixed(3)} s`,
            T.SKIN,
          );
          // A declared rest is drawn to where its segments meet.
          if (pair.rested) objective += T.LIFT * pair.short * pair.short;
        }
        for (const pair of embedded.values()) {
          note(
            pair.short,
            "embedded",
            () =>
              `the body's ${pair.bone} ${pair.short.toFixed(1)} mm inside the arm's ${pair.shape.bone} at ${times[k]!.toFixed(3)} s`,
            T.SKIN,
          );
          if (pair.rested) objective += T.LIFT * pair.short * pair.short;
        }
      }
    });
    if (x.length === 2)
      for (let k: number = 1; k < n; ++k) {
        if (!inner(c, k)) continue;
        crossing[k] = P.crossing(c, k, placed[0]![k]!, placed[1]![k]!, P.CUT);
        for (const pair of crossing[k]!.values()) {
          here = k;
          note(
            pair.short,
            "crossing",
            () =>
              `probe ${pair.probe} of the ${pair.a === 0 ? "first" : "second"} arm ${pair.short.toFixed(1)} mm inside the other's ${pair.bone} at ${times[k]!.toFixed(3)} s`,
            T.SKIN,
          );
          if (pair.rested) objective += T.LIFT * pair.short * pair.short;
        }
      }
    return { placed, objective, violation, worst, pairs, swept, crossing };
  }

  /** Configuration validity owned by HumanArmTrajectoryInvalid.of. */
  export const invalid: typeof HumanArmTrajectoryInvalid.of =
    HumanArmTrajectoryInvalid.of;
}
