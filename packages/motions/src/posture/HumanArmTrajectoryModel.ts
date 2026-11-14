import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmTrajectoryPairs as P } from "./HumanArmTrajectoryPairs";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";

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
 * contact on its site's disc; every collider probe of the arm (the tangle
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
      /** The touched collider's outward normal there, in the segment's frame. */
      normal: IAutoMovieVector3;
      /** The hand's rotation in the segment's frame. */
      rotation?: IAutoMovieQuaternion;
    };
  }

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

  /** What a solve reads, built once (`HumanArmTrajectoryContext.of`). */
  export interface IContext {
    /** The number of waypoints. */
    n: number;
    /** Whether the problem is a still configuration, read without its steps, speeds and sweeps and smoothed only among its inner waypoints. */
    still: boolean;
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
    /** Each arm's coordinates at the last waypoint. */
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
    /** The same between a probe of one arm and a collider of the other (`G.colliders`), the collider's bone for a declared rest. */
    between: (a: number, k: number, probe: number, shape: number, bone: string) => number;
    /** The depth a body corner (`G.IFrame.body`) may keep inside one of the arm's own collider shapes (`G.colliders`, by index) at a waypoint, metres (negative inside): the reverse of `allowed`, as the audit reads every pair both ways. */
    inside: (a: number, k: number, corner: number, shape: number) => number;
    /** Whether an arm's segment lies on a bone at a waypoint, a declared rest (`IRest`). */
    lying: (a: number, k: number, segment: "upperArm" | "lowerArm" | "hand", bone: string) => boolean;
    /** Each site's outward normal, the touched collider's at the site's point. */
    normals: (IAutoMovieVector3 | undefined)[][];
    /** Whether a probe's pair with a bone is a declared rest at a waypoint (`IRest`), read both ways. */
    rested: (a: number, k: number, probe: number, bone: string) => boolean;
    /** Each site's touched collider, the shape nearest its point; -1 where none. */
    touched: number[][];
  }

  /** An iterate's reading. */
  export interface IEvaluation {
    /** Each arm placed at each waypoint. */
    placed: G.IPlaced[][];
    /** The objective. */
    objective: number;
    /** The constraints' violations summed, millimetres. */
    violation: number;
    /** The worst violation past its slack, what it is, the refusal's axis and the waypoint it is read at (an interval's first, for a step or a sweep). */
    worst: { value: number; what: string; axis: string; at: number };
    /** Each arm's deepest probe pairs (`HumanArmTrajectoryPairs.deepest`) and the body's corners in it (`embedded`) at each inner waypoint, as the reading found them, which the convex model reads again at the same iterate. */
    pairs: { deepest: Map<string, P.IPair>; embedded: Map<string, P.IEmbedded> }[][];
  }

  /**
   * The iterate after a step of the convex subproblem: each inner
   * waypoint's free coordinates moved by the step, the ends kept, then
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
        if (k === 0 || k === c.n - 1) return out;
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
  export function ranged(c: IContext, a: number, v: readonly number[]): number[] {
    const out: number[] = [...v];
    const xy: number = Math.hypot(out[0]!, out[1]!);
    const disc: number = swing(c, a);
    if (xy > disc) {
      out[0] = (out[0]! * disc) / xy;
      out[1] = (out[1]! * disc) / xy;
    }
    c.free[a]!.forEach((d: number): void => {
      const b: [number, number] | null | undefined = c.bounds[a]![d];
      if (b !== null && b !== undefined) out[d] = Math.min(b[1], Math.max(b[0], out[d]!));
    });
    return out;
  }

  /**
   * The radius of an arm's chart disc in coordinate units: the chart's
   * unit disc, widened to the rest and the back arm's own swing.
   *
   * @param c The context.
   * @param a The arm.
   * @returns The radius.
   */
  export function swing(c: IContext, a: number): number {
    return Math.max(G.SCALE, Math.hypot(c.rest[a]![0]!, c.rest[a]![1]!), Math.hypot(c.back[a]![0]!, c.back[a]![1]!));
  }

  /**
   * The objective and the constraints' violations at an iterate.
   *
   * @param c The context.
   * @param x Each arm's coordinates at each waypoint.
   * @returns The arms placed, the objective, the summed violation and the worst one past its slack.
   */
  export function evaluate(c: IContext, x: readonly (readonly number[])[][]): IEvaluation {
    const placed: G.IPlaced[][] = x.map((arm: readonly (readonly number[])[], a: number): G.IPlaced[] =>
      arm.map((v: readonly number[], k: number): G.IPlaced => G.placed(c.setups[a]!, c.frames[a]![k]!, v)),
    );
    let objective: number = 0;
    let violation: number = 0;
    let worst: IEvaluation["worst"] = { value: 0, what: "", axis: "region", at: 0 };
    // A clearance miss refuses only past the audit's own skin, the margin
    // the allowance keeps below it aside (`HumanArmTrajectoryTerms.SKIN`).
    // The waypoint the loop below reads, where a violation noted is placed.
    let here: number = 0;
    const pairs: IEvaluation["pairs"] = x.map((): IEvaluation["pairs"][number] => []);
    const note = (v: number, axis: string, what: () => string, slack: number = 0): void => {
      if (v <= 0) return;
      violation += v;
      if (v - slack > worst.value) worst = { value: v - slack, what: what(), axis, at: here };
    };
    const n: number = c.n;
    const times: readonly number[] = c.times;
    x.forEach((arm: readonly (readonly number[])[], a: number): void => {
      // A still configuration's waypoints are smoothed among themselves
      // only: its ends are not part of it.
      for (let k: number = c.still ? 2 : 0; k < (c.still ? n - 2 : n); ++k)
        for (const d of c.free[a]!) {
          const acc: number = arm[Math.min(n - 1, k + 1)]![d]! - 2 * arm[k]![d]! + arm[Math.max(0, k - 1)]![d]!;
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
        for (const p of c.still ? [] : T.PATH) {
          const s: number = 1000 * Vector3.length(Vector3.subtract(placed[a]![k + 1]!.probes[p]![0], placed[a]![k]!.probes[p]![0]));
          objective += T.LENGTH * s * s;
        }
        const dt: number = times[k + 1]! - times[k]!;
        for (const p of c.still ? [] : T.SPEED) {
          const step: number = 1000 * Vector3.length(Vector3.subtract(placed[a]![k + 1]!.probes[p]![0], placed[a]![k]!.probes[p]![0]));
          note(step - 1000 * SPEED_LIMIT * dt, "duration", () => `probe ${p} moves ${(step / dt / 1000).toFixed(2)} m/s at ${times[k]!.toFixed(3)} s`);
        }
        for (let probe: number = 0; probe < (c.still ? 0 : G.SURFACE); ++probe) {
          const [pa, r]: readonly [IAutoMovieVector3, number] = placed[a]![k]!.probes[probe]!;
          const pb: IAutoMovieVector3 = placed[a]![k + 1]!.probes[probe]![0];
          if (Vector3.length(Vector3.subtract(pa, pb)) < r) continue;
          for (const shape of G.near(c.frames[a]![k]!, pa, r + T.REACH)) {
            const lower: number = Math.min(c.allowed(a, k, probe, shape), c.allowed(a, k + 1, probe, shape));
            const short: number = 1000 * (lower - (G.gap(c.frames[a]![k]!, shape, pa, pb) - r));
            note(short, "region", () => `probe ${probe} swept ${short.toFixed(1)} mm inside shape ${shape} after ${times[k]!.toFixed(3)} s`);
          }
        }
      }
      for (let k: number = 1; k + 1 < n; ++k) {
        here = k;
        const site: ISite | undefined = c.sites[a]![k];
        if (site !== undefined) {
          const at: P.ILocated = P.located(c, placed, a, k, site);
          const contact: IAutoMovieVector3 = P.pad(placed[a]![k]!, site.contact);
          const off: IAutoMovieVector3 = Vector3.scale(Vector3.subtract(contact, at.point), 1000);
          const normal: IAutoMovieVector3 | undefined = at.normal;
          const across: number = normal === undefined ? 0 : Vector3.dot(off, normal);
          const slide: number = Vector3.length(normal === undefined ? off : Vector3.subtract(off, Vector3.scale(normal, across)));
          // The contact's height above the touched collider, less the site's
          // own: the site's standing off the surface is kept where the region
          // curves away from its plane.
          const lift: number = normal === undefined || at.shape === undefined ? 0 : 1000 * (at.gap(contact) - at.gap(at.point));
          note(slide - 1000 * site.disc, "region", () => `the hand ${slide.toFixed(1)} mm off its site along the surface at ${times[k]!.toFixed(3)} s, beyond the region's ${(1000 * site.disc).toFixed(0)} mm`);
          objective += T.SITE * slide * slide;
          note(-lift, "region", () => `the hand ${(-lift).toFixed(1)} mm inside its site at ${times[k]!.toFixed(3)} s`);
          objective += T.LIFT * lift * lift;
          if (site.rotation !== undefined) {
            const turned: number = P.angle(at.rotation ?? site.rotation, placed[a]![k]!.hand);
            objective += T.ROTATION * turned * turned;
          }
        }
        const deepest: Map<string, P.IPair> = P.deepest(c, a, k, placed[a]![k]!);
        const embedded: Map<string, P.IEmbedded> = P.embedded(c, a, k, placed[a]![k]!);
        pairs[a]![k] = { deepest, embedded };
        for (const pair of deepest.values()) {
          note(pair.short, "region", () => `probe ${pair.probe} ${pair.short.toFixed(1)} mm inside shape ${pair.shape} at ${times[k]!.toFixed(3)} s`, T.SKIN);
          // A declared rest is drawn to where its segments meet.
          if (pair.rested) objective += T.LIFT * pair.short * pair.short;
        }
        for (const pair of embedded.values()) {
          note(pair.short, "region", () => `the body's ${pair.bone} ${pair.short.toFixed(1)} mm inside the arm's ${pair.shape.bone} at ${times[k]!.toFixed(3)} s`, T.SKIN);
          if (pair.rested) objective += T.LIFT * pair.short * pair.short;
        }
      }
    });
    if (x.length === 2)
      for (let k: number = 1; k + 1 < n; ++k)
        for (const pair of P.crossing(c, k, placed[0]![k]!, placed[1]![k]!).values()) {
          here = k;
          note(pair.short, "region", () => `probe ${pair.probe} of the ${pair.a === 0 ? "first" : "second"} arm ${pair.short.toFixed(1)} mm inside the other's ${pair.bone} at ${times[k]!.toFixed(3)} s`, T.SKIN);
          if (pair.rested) objective += T.LIFT * pair.short * pair.short;
        }
    return { placed, objective, violation, worst, pairs };
  }

  /**
   * How far the arms' configuration at a waypoint passes the tangle audit's
   * clearance (with the skin `evaluate` refuses past) or a joint's range:
   * the configuration is valid where this is within `TOLERANCE`. One reading
   * serves the path planner's validity and the trajectory's refusal.
   *
   * @param c The context.
   * @param k The waypoint whose base and allowances it is read against.
   * @param q Each arm's coordinates.
   * @returns The largest excess, millimetres or coordinate units, and what it is.
   */
  export function invalid(c: IContext, k: number, q: readonly (readonly number[])[]): { value: number; what: string } {
    const placed: G.IPlaced[] = q.map((v: readonly number[], a: number): G.IPlaced => G.placed(c.setups[a]!, c.frames[a]![k]!, v));
    let worst: { value: number; what: string } = { value: -Infinity, what: "" };
    const note = (value: number, what: () => string): void => {
      if (value > worst.value) worst = { value, what: what() };
    };
    q.forEach((v: readonly number[], a: number): void => {
      for (const pair of P.deepest(c, a, k, placed[a]!).values())
        note(pair.short - T.SKIN, () => `probe ${pair.probe} ${pair.short.toFixed(1)} mm inside shape ${pair.shape}`);
      for (const pair of P.embedded(c, a, k, placed[a]!).values())
        note(pair.short - T.SKIN, () => `the body's ${pair.bone} ${pair.short.toFixed(1)} mm inside the arm's ${pair.shape.bone}`);
      c.free[a]!.forEach((d: number): void => {
        const b: [number, number] | null | undefined = c.bounds[a]![d];
        if (b !== null && b !== undefined) note(Math.max(b[0] - v[d]!, v[d]! - b[1]), () => `coordinate ${d} out of its range`);
      });
      note(
        Math.hypot(v[0]!, v[1]!) - swing(c, a),
        () => "the swing out of its chart",
      );
    });
    if (q.length === 2)
      for (const pair of P.crossing(c, k, placed[0]!, placed[1]!).values())
        note(pair.short - T.SKIN, () => `probe ${pair.probe} of the ${pair.a === 0 ? "first" : "second"} arm ${pair.short.toFixed(1)} mm inside the other's ${pair.bone}`);
    return worst;
  }
}
