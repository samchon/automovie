import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";

/**
 * Where a trajectory's waypoints are too far apart for what they must bound
 * between them, read on the trajectory itself, the refinement of a
 * continuous check (conservative advancement: Mirtich 1996, "Impulse-based
 * dynamic simulation of rigid body systems", PhD thesis, UC Berkeley; for
 * articulated bodies Zhang, Redon, Lee and Manocha 2007, "Fast continuous
 * collision detection for articulated models", J Comput Inf Sci Eng 7:2).
 *
 * Two things must hold between two waypoints, read at the instants of the
 * frame grid between them:
 *
 * 1. On the hold, the site's path interpolated through the waypoints' sites
 *    (the cubic Hermite the arm is interpolated by, `hermite`) stays within
 *    `TOLERANCE` of the act's own site at every instant, so no stroke is
 *    cut short between samples.
 * 2. The arms pass the refusal's own reading between them
 *    (`HumanArmTrajectoryModel.invalid`: the probes' and the body's corners'
 *    depths, the two arms' crossings and the ranges). An interval is
 *    certified without that reading where every surface probe (the tangle
 *    audit's corners, which the optimiser reads only at waypoints) travels,
 *    relative to each collider it is near, no farther than the clearance it
 *    keeps at one end before the path is refused
 *    (`HumanArmTrajectoryTerms.SKIN`), a probe farther than the pairs' reach
 *    from every collider no farther than that reach; an interval the bound
 *    cannot certify, a hand resting or sliding on the skin, is read at each
 *    inner instant on the arms' interpolant.
 *
 * An interval whose site strays or whose reading fails at an inner instant
 * is split at its middle, and an interval of less than two frames is never
 * split, so the waypoints are never finer than the frame grid. The frame
 * grid (30 a second) is finer than the tangle audit's own reading (24 a
 * second, `AutoMovieMotionHumanAuditTangle`), so nothing the audit reads
 * falls farther than half a frame from an instant read here.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the method, its sources, the two conditions, how they are read and the cap.
 * @evidence contracts/development/design.md#principled-representation The waypoints' spacing is derived from what they must bound, the site's path and the probes' clearance, read on the trajectory, not from a declared period.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The interpolant, the two-condition reading and the split, read by `HumanArmTrajectory.solve`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts One rule for every hold, still or stroked, and every reach and return.
 */
export namespace HumanArmRefine {
  /**
   * The intervals that do not bound what they must: each `k` whose interval
   * from waypoint `k` to `k + 1` is two frames or longer and fails a
   * condition.
   *
   * @param c The waypoints' context.
   * @param fine The context at the frame grid's instants over the same span, the first and the last the waypoints'.
   * @param x Each arm's coordinates at each waypoint.
   * @returns The intervals to split, ascending.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what an interval must bound and the result.
   * @evidence contracts/development/implementation.md#principled-implementation A continuous check's pipeline: conservative advancement certifies an interval whose probes' motion bounds stay below their clearance, and the exact reading is taken only where it cannot; the site's interpolant is compared with the site itself.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over intervals; per interval the site reading, then the probes'.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every arm, every surface probe and every instant of the frame grid inside an interval is read; an interval below two frames is left as it is, never forced.
   * @evidence contracts/development/implementation.md#efficient-algorithms Per interval one placement per arm and inner instant; the probes' pairs are read at the interval's ends only.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanArmGeometry.placed`, `nearby` and `gap` and the context's `allowed`, the optimiser's own pair reading.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function unbounded(c: M.IContext, fine: M.IContext, x: readonly (readonly (readonly number[])[])[]): number[] {
    const out: number[] = [];
    const ft: readonly number[] = fine.times;
    for (let k: number = 0; k + 1 < c.n; ++k) {
      const from: number = c.times[k]!;
      const to: number = c.times[k + 1]!;
      if (to - from < 2 * STEP - 1e-9) continue;
      const inner: number[] = [];
      ft.forEach((t: number, g: number): void => {
        if (t > from + 1e-9 && t < to - 1e-9) inner.push(g);
      });
      if (inner.length === 0) continue;
      if (strayed(c, fine, k, inner) || (!x.every((_: readonly (readonly number[])[], a: number): boolean => certified(c, fine, x, a, k, inner)) && tangled(c, fine, x, inner))) out.push(k);
    }
    return out;
  }

  /**
   * The waypoints' seconds with each given interval split at its middle.
   *
   * @param times The seconds.
   * @param split The intervals, by their first waypoint.
   * @returns The seconds, ascending.
   */
  export function split(times: readonly number[], split: readonly number[]): number[] {
    const out: number[] = [];
    times.forEach((t: number, k: number): void => {
      out.push(t);
      if (split.includes(k)) out.push((t + times[k + 1]!) / 2);
    });
    return out;
  }

  /**
   * A cubic Hermite through waypoints at their seconds, tangents by central
   * differences in time, still at both ends: the trajectory's interpolant.
   *
   * @param times The waypoints' seconds.
   * @param x The values at each waypoint.
   * @param seconds The second.
   * @returns The values.
   */
  export function hermite(times: readonly number[], x: readonly (readonly number[])[], seconds: number): number[] {
    const n: number = times.length;
    if (seconds <= times[0]!) return [...x[0]!];
    if (seconds >= times[n - 1]!) return [...x[n - 1]!];
    let k: number = 0;
    while (k + 2 < n && times[k + 1]! <= seconds) ++k;
    const h: number = times[k + 1]! - times[k]!;
    const u: number = (seconds - times[k]!) / h;
    const tangent = (j: number): number[] =>
      j === 0 || j === n - 1
        ? new Array(x[0]!.length).fill(0)
        : x[j + 1]!.map((v: number, d: number): number => (v - x[j - 1]![d]!) / (times[j + 1]! - times[j - 1]!));
    const m0: number[] = tangent(k);
    const m1: number[] = tangent(k + 1);
    const h00: number = 2 * u ** 3 - 3 * u ** 2 + 1;
    const h10: number = u ** 3 - 2 * u ** 2 + u;
    const h01: number = -2 * u ** 3 + 3 * u ** 2;
    const h11: number = u ** 3 - u ** 2;
    return x[k]!.map((v: number, d: number): number => h00 * v + h10 * h * m0[d]! + h01 * x[k + 1]![d]! + h11 * h * m1[d]!);
  }
}

/** Whether a hold interval's interpolated site leaves the act's own site by more than `TOLERANCE` at an inner instant. */
function strayed(c: M.IContext, fine: M.IContext, k: number, inner: readonly number[]): boolean {
  return c.sites.some((sites: readonly (M.ISite | undefined)[], a: number): boolean => {
    if (sites[k] === undefined || sites[k + 1] === undefined) return false;
    const held: number[] = [];
    sites.forEach((s: M.ISite | undefined, j: number): void => {
      if (s !== undefined) held.push(j);
    });
    const times: number[] = held.map((j: number): number => c.times[j]!);
    const points: number[][] = held.map((j: number): number[] => {
      const p: IAutoMovieVector3 = sites[j]!.point;
      return [p.x, p.y, p.z];
    });
    return inner.some((g: number): boolean => {
      const actual: M.ISite | undefined = fine.sites[a]![g];
      if (actual === undefined) return false;
      const [px, py, pz] = HumanArmRefine.hermite(times, points, fine.times[g]!) as [number, number, number];
      return Math.hypot(px - actual.point.x, py - actual.point.y, pz - actual.point.z) > TOLERANCE;
    });
  });
}

/** Whether every surface probe of an arm is certified clear over an interval by one of its ends (conservative advancement). */
function certified(c: M.IContext, fine: M.IContext, x: readonly (readonly (readonly number[])[])[], a: number, k: number, inner: readonly number[]): boolean {
  const setup: G.ISetup = c.setups[a]!;
  const inside: G.IPlaced[] = inner.map((g: number): G.IPlaced => G.placed(setup, fine.frames[a]![g]!, HumanArmRefine.hermite(c.times, x[a]!, fine.times[g]!)));
  const ends: G.IPlaced[] = [k, k + 1].map((j: number): G.IPlaced => G.placed(setup, c.frames[a]![j]!, x[a]![j]!));
  const clear = (end: 0 | 1, probe: number): boolean => {
    const j: number = k + end;
    const frame: G.IFrame = c.frames[a]![j]!;
    const placed: G.IPlaced = ends[end]!;
    const [p, r]: readonly [IAutoMovieVector3, number] = placed.probes[probe]!;
    const part: number = frame.segments[probe - G.SURFACE]!;
    const near: number[] = G.nearby(frame, placed, probe, T.REACH).filter((shape: number): boolean => {
      const other: number = frame.shapes[shape]!.part;
      return !(part >= 0 && other >= 0 && frame.related[part]![other]!);
    });
    // Far from every collider: the pairs' reach is the probe's clearance.
    if (near.length === 0)
      return inside.every((q: G.IPlaced): boolean => Vector3.length(Vector3.subtract(q.probes[probe]![0], p)) <= T.REACH);
    return near.every((shape: number): boolean => {
      const short: number = 1000 * (c.allowed(a, j, probe, shape) - (G.gap(frame, shape, p, p) - r));
      const slack: number = (T.SKIN + T.TOLERANCE - short) / 1000;
      const centre: IAutoMovieVector3 = frame.shapes[shape]!.centre;
      return inner.every((g: number, i: number): boolean => {
        const there: G.IShape | undefined = fine.frames[a]![g]!.shapes[shape];
        const moved: IAutoMovieVector3 =
          there === undefined || there.bone !== frame.shapes[shape]!.bone ? { x: 0, y: 0, z: 0 } : Vector3.subtract(there.centre, centre);
        return Vector3.length(Vector3.subtract(Vector3.subtract(inside[i]!.probes[probe]![0], p), moved)) <= slack;
      });
    });
  };
  for (let probe: number = G.SURFACE; probe < ends[0]!.probes.length; ++probe) if (!clear(0, probe) && !clear(1, probe)) return false;
  return true;
}

/** Whether the arms placed on their interpolant at an inner instant pass the refusal's own reading there (`HumanArmTrajectoryModel.invalid`). */
function tangled(c: M.IContext, fine: M.IContext, x: readonly (readonly (readonly number[])[])[], inner: readonly number[]): boolean {
  return inner.some((g: number): boolean => M.invalid(fine, g, x.map((arm: readonly (readonly number[])[]): number[] => HumanArmRefine.hermite(c.times, arm, fine.times[g]!))).value > M.TOLERANCE);
}
/** The frame grid, seconds: the finest the waypoints are spaced. */
const STEP: number = 1 / 30;

/** How far an interpolated site may leave the act's own between waypoints, metres: the millimetre the solve lets a hand miss its site at a waypoint (`HumanArmTrajectoryModel.TOLERANCE`). */
const TOLERANCE: number = M.TOLERANCE / 1000;
